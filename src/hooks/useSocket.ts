"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const socket = connectSocket(token);
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });
    } catch (error) {
      console.error("Socket connection error:", error);
    }
  }, [getToken]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current || getSocket(),
    isConnected,
    connect,
    disconnect,
  };
}
