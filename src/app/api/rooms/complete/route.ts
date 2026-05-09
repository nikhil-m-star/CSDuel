import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { roomId, roomCode, secret } = await req.json();
    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;

    if (!configuredInternalSecret || secret !== configuredInternalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof roomId !== "string" || typeof roomCode !== "string") {
      return NextResponse.json({ error: "Room details are required" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      select: {
        id: true,
        code: true,
        status: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.code !== roomCode) {
      return NextResponse.json({ error: "Room mismatch" }, { status: 400 });
    }

    if (room.status !== "COMPLETED") {
      await prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          status: "COMPLETED",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Room completion error:", error);
    return NextResponse.json({ error: "Failed to complete room" }, { status: 500 });
  }
}
