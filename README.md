# CSDuel ⚔️
### The Ultimate Real-Time Competitive Platform for Computer Science Mastery

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-blue)](https://socket.io/)
[![AI Powered](https://img.shields.io/badge/AI-NVIDIA%20NIM-red)](https://build.nvidia.com/)

**CSDuel** is a premium, full-stack competitive platform designed for developers to sharpen their Computer Science fundamentals through high-stakes, real-time 1v1 battles. Test your speed and accuracy in DSA, OS, DBMS, Networks, and OOPs.

---

## ✨ Features

### 🎮 Dynamic Gameplay
- **Global Matchmaking**: Join a global queue and get paired instantly with an opponent of similar caliber.
- **Private Friend Rooms**: Generate a unique room code and challenge your friends to a private duel.
- **Real-Time Synchronization**: Experience zero-latency duels with active socket synchronization for timers, scores, and opponent progress.

### 🧠 Intelligent Question Engine
- **NVIDIA NIM Integration**: Powered by **Llama 3.3-70B**, every duel features unique, AI-generated questions tailored to the CS curriculum.
- **Balanced Mixed-Mode**: Every duel rigorously covers five core domains: Data Structures, Operating Systems, Databases, Computer Networks, and OOPs.

### 💎 Premium Design System
- **"District" Aesthetic**: A stark, high-contrast UI/UX inspired by modern dark-mode design systems.
- **Micro-Animations**: Smooth, framer-motion powered transitions and interactive elements for a truly premium feel.
- **Responsive Layout**: Seamlessly duel on your desktop, tablet, or mobile device.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) |
| **Real-time** | Socket.io (Standalone Node.js Server) |
| **Database** | PostgreSQL via Neon |
| **ORM** | Prisma |
| **Auth** | Clerk (Google OAuth + Email) |
| **AI Engine** | NVIDIA NIM (Llama 3.3) |
| **Styling** | TailwindCSS + Framer Motion |

---

## ⚙️ Deployment & Environment

To deploy CSDuel, you need to configure the following environment variables across your frontend (Vercel) and backend (Render).

### 🖥️ Frontend (Vercel)
- `DATABASE_URL`: Connection string for your PostgreSQL DB.
- `CLERK_SECRET_KEY`: Clerk private key.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key.
- `NVIDIA_NIM_API_KEY`: API key for question generation.
- `NEXT_PUBLIC_SOCKET_URL`: URL of your deployed Socket server.
- `SOCKET_INTERNAL_SECRET`: Secret key for server-to-server communication.

### 📡 Backend (Render)
- `PORT`: 10000
- `CLERK_SECRET_KEY`: Clerk private key.
- `NEXT_PUBLIC_APP_URL`: URL of your deployed Vercel frontend.
- `SOCKET_INTERNAL_SECRET`: Matching secret for internal API calls.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Neon (PostgreSQL) account
- A Clerk account
- An NVIDIA NIM API key

### Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/nikhil-m-star/CSDuel.git
   cd CSDuel
   npm install
   cd socket-server && npm install && cd ..
   ```

2. **Database Migration**:
   ```bash
   npx prisma db push
   ```

3. **Development**:
   - Run Frontend: `npm run dev`
   - Run Socket Server: `cd socket-server && npm start`

---

## 🛡️ Architecture Overview

CSDuel implements a **Dual-Service Architecture**:
1. **Application Service**: A Next.js application that handles user management, authentication, and persistent game history.
2. **Real-Time Service**: A standalone Node.js server that manages the volatile state of active duels, matchmaking queues, and millisecond-accurate question timers.

Both services communicate through a **Secured Internal Sync Layer**, ensuring that game results and AI-generated questions are consistently reflected in the database.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📜 License

This project is licensed under the **MIT License**.

---

*Built with passion for the developer community.*
