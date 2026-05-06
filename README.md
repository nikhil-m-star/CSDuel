# CSDuel ⚔️

**Real-time 1v1 CS Fundamentals & DSA Quiz Battles**

CSDuel is a high-fidelity competitive platform where developers can duel each other in real-time on core Computer Science concepts. Pair up globally with matchmaking or challenge friends to private rooms to test your knowledge in DSA, Operating Systems, DBMS, Computer Networks, and OOPs.

![CSDuel Logo](src/app/icon.svg)

---

## 🚀 Key Features

- **Global Matchmaking**: Pair up instantly with developers online using our FIFO matchmaking queue.
- **AI-Powered Question Engine**: Questions are dynamically generated for every duel using **NVIDIA NIM (Llama 3.3-70B)**, ensuring no two battles are ever the same.
- **Mixed Mode Mastery**: Every duel covers a balanced mix of DSA, OS, DBMS, Networks, and Object-Oriented Programming.
- **Real-Time Synchronization**: Powered by **Socket.io** for millisecond-precision timing and score updates.
- **District Aesthetic**: A premium, minimalist UI/UX inspired by the "District by Zomato" design system—stark black, vibrant accents, and massive border radii.
- **Global Leaderboard**: Track your progress and rank among the top duelists worldwide.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, Socket.io (Standalone WebSocket server)
- **Database**: PostgreSQL (via Neon), Prisma ORM
- **Authentication**: Clerk (Google OAuth + Email)
- **AI**: NVIDIA NIM API (Llama 3.3-70B)
- **Styling**: Vanilla CSS + Tailwind Utility Classes

---

## ⚙️ Environment Configuration

To run this project locally, you will need the following environment variables:

### Frontend (.env.local)
```env
DATABASE_URL=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NVIDIA_NIM_API_KEY=
NEXT_PUBLIC_SOCKET_URL=http://localhost:10000
SOCKET_INTERNAL_SECRET=
```

### Socket Server (socket-server/.env)
```env
PORT=10000
CLERK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
SOCKET_INTERNAL_SECRET=
```

---

## 🛠️ Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nikhil-m-star/CSDuel.git
   cd CSDuel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd socket-server && npm install && cd ..
   ```

3. **Database Setup**:
   ```bash
   npx prisma db push
   ```

4. **Run the Application**:
   - In terminal 1 (Frontend): `npm run dev`
   - In terminal 2 (Socket Server): `cd socket-server && npm start`

---

## 🛡️ Architecture

CSDuel uses a **distributed architecture** to ensure real-time performance:
- The **Next.js App** handles the UI, Auth, and persistent data (DB).
- The **Socket Server** handles the ephemeral state of active duels, timers, and matchmaking.
- They communicate via a secured **Internal API** channel to sync game results and generate questions.

---

## 📜 License

This project is licensed under the MIT License.

*Built with ❤️ for the CS community.*
