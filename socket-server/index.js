/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
require("dotenv").config({ path: "../.env.local" });
require("dotenv").config({ path: "../.env" });

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { verifyToken } = require("@clerk/backend");

const port = process.env.PORT || 3001;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const socketInternalSecret = process.env.SOCKET_INTERNAL_SECRET;


// Log config on startup so Render logs show exactly what URLs are in use
console.log(`[Config] App URL: ${appUrl}`);
console.log(`[Config] Port: ${port}`);
console.log(`[Config] Internal secret configured: ${!!socketInternalSecret}`);
console.log(`[Config] Clerk secret configured: ${!!process.env.CLERK_SECRET_KEY}`);

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [appUrl, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || origin.startsWith("http://") || origin.startsWith("https://")) {
      callback(null, true);
      return;
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(null, true);
  },
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.get("/", (req, res) => {
  res.send("CSDuel Socket Server is running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    appUrl,
    queueLength: matchmakingQueue.length,
    secretConfigured: !!socketInternalSecret,
  });
});

// In-memory room state for timer management
const roomTimers = new Map();
const roomStates = new Map();
const startingRooms = new Set();

// Matchmaking Queue
let matchmakingQueue = [];

async function postInternal(path, payload) {
  if (!socketInternalSecret) {
    throw new Error("SOCKET_INTERNAL_SECRET is not configured on the socket server");
  }

  const url = `${appUrl}${path}`;
  console.log(`[postInternal] POST ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      secret: socketInternalSecret,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[postInternal] ${path} returned ${response.status}:`, data);
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
  } catch (err) {
    console.error("[Auth] Token verification failed:", err.message);
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
    const clerkId = socket.data.clerkUserId;
    console.log(`[Matchmaking] find-match from ${socket.id} (clerk: ${clerkId})`);

    // Purge stale / disconnected sockets from queue
    matchmakingQueue = matchmakingQueue.filter(s => s.connected);
    console.log(`[Matchmaking] Queue length after purge: ${matchmakingQueue.length}`);

    // Prevent duplicate queue entries for same user
    const alreadyQueued = matchmakingQueue.some(s => s.data.clerkUserId === clerkId);
    if (alreadyQueued) {
      console.log(`[Matchmaking] ${clerkId} already in queue, ignoring`);
      return;
    }

    // Pop next connected opponent from front of queue
    let opponentSocket = null;
    while (matchmakingQueue.length > 0) {
      const candidate = matchmakingQueue.shift();
      if (candidate && candidate.connected) {
        opponentSocket = candidate;
        break;
      }
    }

    if (opponentSocket) {
      // Sanity check: don't match with self
      if (opponentSocket.data.clerkUserId === clerkId) {
        console.log(`[Matchmaking] Self-match prevented for ${clerkId}`);
        matchmakingQueue.unshift(opponentSocket); // put back
        matchmakingQueue.push(socket);
        return;
      }

      console.log(`[Matchmaking] Pairing ${clerkId} ↔ ${opponentSocket.data.clerkUserId}`);

      try {
        const data = await postInternal("/api/rooms/matchmaking", {
          userIds: [clerkId, opponentSocket.data.clerkUserId],
        });

        const roomCode = data.roomCode;
        console.log(`[Matchmaking] Room created: ${roomCode} — notifying both clients`);

        opponentSocket.emit("match-found", { roomCode });
        socket.emit("match-found", { roomCode });
      } catch (error) {
        console.error("[Matchmaking] Room creation failed:", error.message);
        const errMsg = error.message.includes("SOCKET_INTERNAL_SECRET")
          ? "Server configuration error. Please contact support."
          : "Matchmaking failed. Please try again.";
        socket.emit("match-error", { message: errMsg });
        opponentSocket.emit("match-error", { message: errMsg });
        // Put opponent back in queue so they can retry
        if (opponentSocket.connected) matchmakingQueue.push(opponentSocket);
      }
    } else {
      console.log(`[Matchmaking] No opponent found, adding ${clerkId} to queue`);
      matchmakingQueue.push(socket);
    }
  });

  socket.on("cancel-match", () => {
    console.log(`[Socket] ${socket.id} canceled match`);
    matchmakingQueue = matchmakingQueue.filter(s => s.id !== socket.id);
  });

  socket.on("start-duel", async ({ roomCode, roomId }) => {
    // Auto-join room if socket isn't in it yet (handles matchmaking race)
    if (!socket.rooms.has(roomCode)) {
      socket.join(roomCode);
      console.log(`[Socket] Auto-joined ${socket.id} to room ${roomCode} for start-duel`);
    }

    let state = roomStates.get(roomCode);

    // Prevent multiple starts or concurrent initialization
    if ((state && state.status === "IN_PROGRESS") || startingRooms.has(roomCode)) {
      console.log(`[Socket] Duel already starting/in progress for room ${roomCode}`);
      return;
    }

    startingRooms.add(roomCode);
    console.log(`[Socket] Starting duel in room ${roomCode} (ID: ${roomId})`);

    try {
      try {
        await postInternal("/api/questions/generate/internal", {
          roomId,
          roomCode,
          clerkId: socket.data.clerkUserId,
        });
      } catch (err) {
        console.warn("[Socket] Question sync warning:", err.message);
      }

      roomStates.set(roomCode, {
        status: "IN_PROGRESS",
        roomId,
        currentQuestion: 0,
        scores: {},
        answeredCount: {},
      });

      state = roomStates.get(roomCode);
      io.to(roomCode).emit("room-update", { status: "IN_PROGRESS" });

      setTimeout(() => {
        io.to(roomCode).emit("duel-start", { questions: [] });
        startQuestionTimer(io, roomCode, 0);
      }, 3000);

    } catch (error) {
      console.error("[Socket] Start duel error:", error);
      io.to(roomCode).emit("room-error", {
        message: error instanceof Error ? error.message : "Failed to start duel. Please try again.",
      });
    } finally {
      startingRooms.delete(roomCode);
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

async function advanceQuestion(io, roomCode) {
  const state = roomStates.get(roomCode);
  if (!state) return;

  if (roomTimers.has(roomCode)) {
    clearInterval(roomTimers.get(roomCode));
    roomTimers.delete(roomCode);
  }

  const nextQuestion = state.currentQuestion + 1;

  if (nextQuestion >= 10) {
    state.status = "COMPLETED";
    try {
      await postInternal("/api/rooms/complete", {
        roomId: state.roomId,
        roomCode,
      });
    } catch (error) {
      console.error("[Socket] Room completion sync error:", error);
    }

    io.to(roomCode).emit("room-update", { status: "COMPLETED" });
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
  console.log(`> CSDuel Socket Server running on port ${port}`);
  console.log(`> Expecting Next.js app at: ${appUrl}`);
});
