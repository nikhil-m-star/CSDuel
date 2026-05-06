const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// In-memory room state for timer management
const roomTimers = new Map();
const roomStates = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Clerk JWT verification middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Token missing"));

    try {
      const { verifyToken } = require("@clerk/backend");
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

      // Notify room about new player
      io.to(roomCode).emit("room-update", {
        players: getRoomPlayers(io, roomCode),
        status: roomStates.get(roomCode)?.status || "WAITING",
      });
    });

    socket.on("start-duel", async ({ roomCode, roomId }) => {
      console.log(`[Socket] Starting duel in room ${roomCode}`);

      roomStates.set(roomCode, {
        status: "IN_PROGRESS",
        roomId,
        currentQuestion: 0,
        scores: {},
        answeredCount: {},
      });

      // Fetch questions from DB
      try {
        const res = await fetch(`http://localhost:${port}/api/rooms/${roomCode}`, {
          headers: { Authorization: `Bearer internal` },
        });
        // We'll get questions from the generate endpoint already called
      } catch (e) {
        console.error("Error fetching room:", e);
      }

      io.to(roomCode).emit("room-update", { players: getRoomPlayers(io, roomCode), status: "IN_PROGRESS" });

      // Start countdown then questions
      setTimeout(() => {
        io.to(roomCode).emit("duel-start", { questions: [] }); // Client already has questions from API
        startQuestionTimer(io, roomCode, 0);
      }, 3000);
    });

    socket.on("submit-answer", ({ roomCode, roomId, questionId, selectedAnswer, timeTaken }) => {
      const state = roomStates.get(roomCode);
      if (!state) return;

      const clerkId = socket.data.clerkUserId;

      // Track scores
      if (!state.scores[clerkId]) state.scores[clerkId] = 0;

      // Notify opponent
      socket.to(roomCode).emit("opponent-answered", { questionIndex: state.currentQuestion });

      // Track answered count for this question
      const qKey = `${state.currentQuestion}`;
      if (!state.answeredCount[qKey]) state.answeredCount[qKey] = 0;
      state.answeredCount[qKey]++;

      // If both players answered, advance immediately
      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      const playerCount = roomSockets ? roomSockets.size : 2;
      if (state.answeredCount[qKey] >= playerCount) {
        advanceQuestion(io, roomCode);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  function startQuestionTimer(io, roomCode, questionIndex) {
    const state = roomStates.get(roomCode);
    if (!state) return;

    state.currentQuestion = questionIndex;
    let timeLeft = 30;

    // Clear existing timer
    if (roomTimers.has(roomCode)) {
      clearInterval(roomTimers.get(roomCode));
    }

    const timer = setInterval(() => {
      timeLeft--;
      io.to(roomCode).emit("question-timer", { timeRemaining: timeLeft, questionIndex });

      if (timeLeft <= 0) {
        clearInterval(timer);
        roomTimers.delete(roomCode);
        // Auto-advance after timeout + brief delay for feedback
        setTimeout(() => advanceQuestion(io, roomCode), 2000);
      }
    }, 1000);

    roomTimers.set(roomCode, timer);
  }

  function advanceQuestion(io, roomCode) {
    const state = roomStates.get(roomCode);
    if (!state) return;

    // Clear any existing timer
    if (roomTimers.has(roomCode)) {
      clearInterval(roomTimers.get(roomCode));
      roomTimers.delete(roomCode);
    }

    const nextQuestion = state.currentQuestion + 1;

    if (nextQuestion >= 10) {
      // Duel is over
      state.status = "COMPLETED";
      io.to(roomCode).emit("duel-end", { roomId: state.roomId });
      roomStates.delete(roomCode);
      return;
    }

    // Brief delay before next question
    setTimeout(() => {
      io.to(roomCode).emit("next-question", { questionIndex: nextQuestion });
      startQuestionTimer(io, roomCode, nextQuestion);
    }, 1500);
  }

  function getRoomPlayers(io, roomCode) {
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    if (!roomSockets) return [];
    const players = [];
    for (const socketId of roomSockets) {
      const s = io.sockets.sockets.get(socketId);
      if (s) {
        players.push({ clerkUserId: s.data.clerkUserId, socketId });
      }
    }
    return players;
  }

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> CSDuel ready on http://${hostname}:${port}`);
  });
});
