"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
const url = (rawUrl || "http://localhost:3001").replace(/\/$/, "");

export function getSocketUrl(): string {
  return url;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (typeof window !== "undefined" && !rawUrl && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    console.warn("[Socket] NEXT_PUBLIC_SOCKET_URL is not set! Socket connection will default to localhost.");
  }

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
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 30000,
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
