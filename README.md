# CSDuel ⚔️
### The Ultimate Real-Time Competitive Platform for Computer Science Mastery

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-blue)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)
[![AI Powered](https://img.shields.io/badge/AI-NVIDIA%20NIM-red)](https://build.nvidia.com/)

**CSDuel** is a full-stack, real-time competitive platform designed for developers to sharpen their Computer Science fundamentals through high-stakes, 1v1 online battles. Test your speed, logic, and precision across Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, and Object-Oriented Programming.

---

## ✨ Key Features

### 🎮 Real-Time Duels & Matchmaking
- **Global Queue & Auto-Matchmaking**: Instantly queue up to be paired with an opponent online.
- **Private Friend Duels**: Generate a unique room code to invite and challenge friends directly.
- **Zero-Latency Socket Sync**: Powered by a standalone Socket.io server to synchronize timers, round scores, answer lock-ins, and match completions in real time.

### 🗄️ High-Performance Database Question Engine
- **3,000+ Verified CS Questions**: Pure database-backed question bank stored in PostgreSQL (`QuestionBank` table). Zero static arrays in runtime application code.
- **5 Core CS Curriculum Domains**: Covers DSA, Operating Systems, DBMS, Computer Networks, and OOP / System Design.
- **Instant Match Start (<50ms)**: Fast, non-blocking room question population directly from PostgreSQL.

### 💡 In-Game AI Assistance (Max 3/Duel)
- **Fast Conceptual Hints**: Request up to 3 AI-generated hints per duel during active gameplay powered by `meta/llama-3.1-8b-instruct`.
- **Subtle Guidance**: Hints guide conceptual understanding without spoiling direct option letters.

### 📊 Post-Game AI Match Breakdown
- **Instant Post-Match Analysis**: Generate a comprehensive AI performance report after every duel.
- **In-Depth Metrics**: Analyzes accuracy per topic, answer speed under pressure, key mistakes, and personalized learning advice.

### 💎 Modern Glassmorphic Design System
- **Dark Glassmorphism UI**: High-contrast, sleek aesthetic with subtle gradients, glowing borders, and smooth micro-animations.
- **Fully Responsive**: Optimized for desktop, tablet, and mobile browsers.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | React 19, Server & Client Components |
| **Real-Time** | Socket.io | Standalone Node.js server for WebSocket state sync |
| **Database** | PostgreSQL (Neon) | Cloud-hosted serverless PostgreSQL |
| **ORM** | Prisma 7 | Type-safe database client and migrations |
| **Auth** | Clerk | OAuth & Email-based user authentication |
| **AI Engine** | NVIDIA NIM API | Powered by `meta/llama-3.1-8b-instruct` |
| **Styling** | Vanilla CSS + TailwindCSS + Framer Motion | Dynamic animations & glassmorphism |

---

## ⚙️ Environment Variables

Configure these variables in your Vercel (Frontend) and Render (Socket Server) deployments:

### 🖥️ Frontend (Vercel)
```env
DATABASE_URL="postgresql://user:pass@ep-host.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NVIDIA_NIM_API_KEY="nvapi-..."
NEXT_PUBLIC_SOCKET_URL="https://your-socket-server.onrender.com"
SOCKET_INTERNAL_SECRET="your_secret_key"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### 📡 Socket Server (Render / Node.js)
```env
PORT=3001
CLERK_SECRET_KEY="sk_test_..."
APP_URL="https://your-app.vercel.app"
SOCKET_INTERNAL_SECRET="your_secret_key"
```

---

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   git clone https://github.com/nikhil-m-star/CSDuel.git
   cd CSDuel
   npm install
   cd socket-server && npm install && cd ..
   ```

2. **Database Push & Seed**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

3. **Run Locally**:
   - Start Frontend: `npm run dev` (Runs at `http://localhost:3000`)
   - Start Socket Server: `npm run socket` (Runs at `http://localhost:3001`)

---

## 📜 License

Licensed under the **MIT License**.
