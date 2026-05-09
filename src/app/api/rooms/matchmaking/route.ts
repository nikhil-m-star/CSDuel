import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRoomCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { roomCode, userIds, secret } = await req.json();
    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;

    // Secure the internal endpoint
    if (!configuredInternalSecret || secret !== configuredInternalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Array.isArray(userIds) || new Set(userIds).size !== 2) {
      return NextResponse.json({ error: "Exactly two unique users are required" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        clerkId: {
          in: userIds,
        },
      },
    });

    if (users.length !== 2) {
      return NextResponse.json({ error: "Both users must be synced before matchmaking" }, { status: 400 });
    }

    let finalRoomCode = typeof roomCode === "string" ? roomCode.toUpperCase() : "";
    let attempts = 0;
    while (attempts < 10) {
      finalRoomCode = finalRoomCode || generateRoomCode();
      const existingRoom = await prisma.room.findUnique({ where: { code: finalRoomCode } });
      if (!existingRoom) {
        break;
      }
      finalRoomCode = "";
      attempts++;
    }

    if (!finalRoomCode) {
      return NextResponse.json({ error: "Failed to create a unique matchmaking room" }, { status: 500 });
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        code: finalRoomCode,
        topic: "Mixed",
        status: "WAITING",
        players: {
          create: userIds.map((clerkId: string) => ({
            user: { connect: { clerkId } }
          }))
        }
      }
    });

    return NextResponse.json({ success: true, roomId: room.id, roomCode: room.code });
  } catch (error) {
    console.error("Internal matchmaking room creation error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
