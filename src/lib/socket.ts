"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  // Always create a fresh socket when connecting
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(url, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.connect();
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
