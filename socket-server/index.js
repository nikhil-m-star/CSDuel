require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { verifyToken } = require("@clerk/backend");

const port = process.env.PORT || 3001;
const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust in production to match your Vercel URL
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.send("CSDuel Socket Server is running!");
});

// In-memory room state for timer management
const roomTimers = new Map();
const roomStates = new Map();

// Matchmaking Queue
let matchmakingQueue = [];

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
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id} (clerk: ${socket.data.clerkUserId})`);

  socket.on("join-room", (roomCode) => {
    socket.join(roomCode);
    console.log(`[Socket] ${socket.id} joined room ${roomCode}`);

    io.to(roomCode).emit("room-update", {
      status: roomStates.get(roomCode)?.status || "WAITING",
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
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`[Socket] Match found! Created room ${roomCode}. Syncing with DB...`);

      // Call internal Next.js API to create the room in DB
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rooms/matchmaking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomCode,
            userIds: [socket.data.clerkUserId, opponentSocket.data.clerkUserId],
            secret: process.env.SOCKET_INTERNAL_SECRET
          })
        });

        if (!response.ok) throw new Error(`DB sync failed: ${response.status}`);

        // Tell both clients to join this room via routing
        opponentSocket.emit("match-found", { roomCode });
        socket.emit("match-found", { roomCode });
      } catch (err) {
        console.error("[Socket] Matchmaking DB sync error:", err);
        // Put users back in queue if DB sync fails? 
        // For now, just cancel for these users
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
    let state = roomStates.get(roomCode);
    
    // Prevent multiple starts
    if (state && state.status === "IN_PROGRESS") {
      console.log(`[Socket] Duel already in progress for room ${roomCode}`);
      return;
    }

    console.log(`[Socket] Starting duel in room ${roomCode} (ID: ${roomId})`);

    // Call internal Next.js API to generate questions
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/questions/generate/internal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          secret: process.env.SOCKET_INTERNAL_SECRET
        })
      });

      if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

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

    } catch (err) {
      console.error("[Socket] Start duel error:", err);
      socket.emit("room-error", { message: "Failed to start duel. Please try again." });
    }
  });

  socket.on("submit-answer", ({ roomCode, roomId, questionId, selectedAnswer, timeTaken, score }) => {
    const state = roomStates.get(roomCode);
    if (!state) return;

    const clerkId = socket.data.clerkUserId;
    
    // Update score
    if (!state.scores[clerkId]) state.scores[clerkId] = 0;
    state.scores[clerkId] += (score || 0);

    // Broadcast score update to everyone in the room
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
