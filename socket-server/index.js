/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { verifyToken } = require("@clerk/backend");

const port = process.env.PORT || 3001;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
const socketInternalSecret = process.env.SOCKET_INTERNAL_SECRET;
const app = express();

const allowedOrigins = Array.from(
  new Set(
    [appUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

app.get("/", (req, res) => {
  res.send("CSDuel Socket Server is running!");
});

// In-memory room state for timer management
const roomTimers = new Map();
const roomStates = new Map();

// Matchmaking Queue
let matchmakingQueue = [];

function buildAppUrl(path) {
  return `${appUrl.replace(/\/$/, "")}${path}`;
}

async function postInternal(path, payload) {
  if (!socketInternalSecret) {
    throw new Error("SOCKET_INTERNAL_SECRET is not configured");
  }

  const response = await fetch(buildAppUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      secret: socketInternalSecret,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `${path} failed with ${response.status}`);
  }

  return data;
}

// Clerk JWT verification middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: Token missing"));

  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    socket.data.clerkUserId = verified.sub;
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id} (clerk: ${socket.data.clerkUserId})`);

  socket.on("join-room", (roomCode) => {
    const normalizedRoomCode = typeof roomCode === "string" ? roomCode.toUpperCase() : "";
    if (!normalizedRoomCode) {
      socket.emit("room-error", { message: "Invalid room code." });
      return;
    }

    socket.join(normalizedRoomCode);
    console.log(`[Socket] ${socket.id} joined room ${normalizedRoomCode}`);

    io.to(normalizedRoomCode).emit("room-update", {
      status: roomStates.get(normalizedRoomCode)?.status || "WAITING",
    });
  });

  socket.on("find-match", async () => {
    console.log(`[Socket] ${socket.id} finding match`);
    
    // Check if player is already in queue
    const existingIndex = matchmakingQueue.findIndex(s => s.data.clerkUserId === socket.data.clerkUserId);
    if (existingIndex !== -1) return;

    if (matchmakingQueue.length > 0) {
      // We found a match!
      const opponentSocket = matchmakingQueue.shift();
      
      // Don't match with self
      if (opponentSocket.data.clerkUserId === socket.data.clerkUserId) {
        matchmakingQueue.push(socket);
        return;
      }

      // Generate a random room code (6 chars)
      const proposedRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`[Socket] Match found! Creating room from queue...`);

      // Call internal Next.js API to create the room in DB
      try {
        const data = await postInternal("/api/rooms/matchmaking", {
          roomCode: proposedRoomCode,
          userIds: [socket.data.clerkUserId, opponentSocket.data.clerkUserId],
        });
        const roomCode = data.roomCode;

        // Tell both clients to join this room via routing
        opponentSocket.emit("match-found", { roomCode });
        socket.emit("match-found", { roomCode });
      } catch (error) {
        console.error("[Socket] Matchmaking DB sync error:", error);
        socket.emit("match-error", { message: "Matchmaking failed. Please try again." });
        opponentSocket.emit("match-error", { message: "Matchmaking failed. Please try again." });
      }
    } else {
      matchmakingQueue.push(socket);
    }
  });

  socket.on("cancel-match", () => {
    console.log(`[Socket] ${socket.id} canceled match`);
    matchmakingQueue = matchmakingQueue.filter(s => s.id !== socket.id);
  });

  socket.on("start-duel", async ({ roomCode, roomId }) => {
    if (!socket.rooms.has(roomCode)) {
      socket.emit("room-error", { message: "Join the room before starting the duel." });
      return;
    }

    let state = roomStates.get(roomCode);
    
    // Prevent multiple starts
    if (state && state.status === "IN_PROGRESS") {
      console.log(`[Socket] Duel already in progress for room ${roomCode}`);
      return;
    }

    console.log(`[Socket] Starting duel in room ${roomCode} (ID: ${roomId})`);

    // Call internal Next.js API to generate questions
    try {
      await postInternal("/api/questions/generate/internal", {
        roomId,
        roomCode,
        clerkId: socket.data.clerkUserId,
      });

      roomStates.set(roomCode, {
        status: "IN_PROGRESS",
        roomId,
        currentQuestion: 0,
        scores: {},
        answeredCount: {},
      });

      state = roomStates.get(roomCode);
      io.to(roomCode).emit("room-update", { status: "IN_PROGRESS" });

      // Start countdown then questions
      setTimeout(() => {
        // Fetch fresh room data to get questions (client will do this on duel-start)
        io.to(roomCode).emit("duel-start", { questions: [] });
        startQuestionTimer(io, roomCode, 0);
      }, 3000);

    } catch (error) {
      console.error("[Socket] Start duel error:", error);
      socket.emit("room-error", {
        message: error instanceof Error ? error.message : "Failed to start duel. Please try again.",
      });
    }
  });

  socket.on("submit-answer", async ({ roomCode, roomId, questionId, selectedAnswer, timeTaken }) => {
    const state = roomStates.get(roomCode);
    if (!state || !socket.rooms.has(roomCode)) return;

    const clerkId = socket.data.clerkUserId;

    try {
      const result = await postInternal("/api/answers", {
        roomId,
        questionId,
        selectedAnswer,
        timeTaken,
        clerkId,
      });

      socket.emit("answer-result", result);

      if (!result.accepted) {
        return;
      }

      state.scores[clerkId] = result.totalScore;

      io.to(roomCode).emit("score-update", { scores: state.scores });
      socket.to(roomCode).emit("opponent-answered", { questionIndex: state.currentQuestion });

      const qKey = `${state.currentQuestion}`;
      if (!state.answeredCount[qKey]) state.answeredCount[qKey] = 0;
      state.answeredCount[qKey]++;

      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      const playerCount = roomSockets ? roomSockets.size : 2;
      if (state.answeredCount[qKey] >= playerCount) {
        advanceQuestion(io, roomCode);
      }
    } catch (error) {
      console.error("[Socket] Answer submission error:", error);
      socket.emit("answer-error", {
        message: error instanceof Error ? error.message : "Failed to submit answer.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    matchmakingQueue = matchmakingQueue.filter(s => s.id !== socket.id);
  });
});

function startQuestionTimer(io, roomCode, questionIndex) {
  const state = roomStates.get(roomCode);
  if (!state) return;

  state.currentQuestion = questionIndex;
  let timeLeft = 30;

  if (roomTimers.has(roomCode)) {
    clearInterval(roomTimers.get(roomCode));
  }

  const timer = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit("question-timer", { timeRemaining: timeLeft, questionIndex });

    if (timeLeft <= 0) {
      clearInterval(timer);
      roomTimers.delete(roomCode);
      setTimeout(() => advanceQuestion(io, roomCode), 2000);
    }
  }, 1000);

  roomTimers.set(roomCode, timer);
}

function advanceQuestion(io, roomCode) {
  const state = roomStates.get(roomCode);
  if (!state) return;

  if (roomTimers.has(roomCode)) {
    clearInterval(roomTimers.get(roomCode));
    roomTimers.delete(roomCode);
  }

  const nextQuestion = state.currentQuestion + 1;

  if (nextQuestion >= 10) {
    state.status = "COMPLETED";
    io.to(roomCode).emit("duel-end", { roomId: state.roomId });
    roomStates.delete(roomCode);
    return;
  }

  setTimeout(() => {
    io.to(roomCode).emit("next-question", { questionIndex: nextQuestion });
    startQuestionTimer(io, roomCode, nextQuestion);
  }, 1500);
}

httpServer.listen(port, () => {
  console.log(`> Standalone CSDuel Socket Server running on port ${port}`);
});
