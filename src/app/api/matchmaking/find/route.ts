import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRoomCode } from "@/lib/utils";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in Prisma DB
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found. Please refresh." }, { status: 404 });
    }

    // Clean up old empty waiting rooms created >5 minutes ago by this user
    await prisma.room.deleteMany({
      where: {
        status: "WAITING",
        createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
        players: {
          every: { userId: user.id },
        },
      },
    });

    // 1. Check if user is already waiting in an active room
    const existingRoom = await prisma.room.findFirst({
      where: {
        status: "WAITING",
        players: {
          some: { userId: user.id },
        },
      },
      include: {
        players: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingRoom) {
      return NextResponse.json({
        success: true,
        roomCode: existingRoom.code,
        playerCount: existingRoom.players.length,
        isHost: existingRoom.players[0]?.userId === user.id,
      });
    }

    // 2. Search for an open waiting room created in the last 3 minutes by someone else
    const availableRoom = await prisma.room.findFirst({
      where: {
        topic: "Mixed",
        status: "WAITING",
        createdAt: { gte: new Date(Date.now() - 3 * 60 * 1000) },
        players: {
          none: { userId: user.id },
        },
      },
      include: {
        players: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (availableRoom && availableRoom.players.length === 1) {
      // Join existing room
      await prisma.roomPlayer.create({
        data: {
          roomId: availableRoom.id,
          userId: user.id,
        },
      });

      console.log(`[Matchmaking] User ${user.id} joined existing room ${availableRoom.code}`);

      return NextResponse.json({
        success: true,
        roomCode: availableRoom.code,
        playerCount: 2,
        isHost: false,
      });
    }

    // 3. No open room found: Create a new room
    let roomCode = "";
    for (let i = 0; i < 10; i++) {
      const candidate = generateRoomCode();
      const existing = await prisma.room.findUnique({ where: { code: candidate } });
      if (!existing) {
        roomCode = candidate;
        break;
      }
    }

    if (!roomCode) {
      return NextResponse.json({ error: "Failed to generate room code" }, { status: 500 });
    }

    const newRoom = await prisma.room.create({
      data: {
        code: roomCode,
        topic: "Mixed",
        status: "WAITING",
        players: {
          create: [{ userId: user.id }],
        },
      },
    });

    console.log(`[Matchmaking] User ${user.id} created new room ${newRoom.code}`);

    return NextResponse.json({
      success: true,
      roomCode: newRoom.code,
      playerCount: 1,
      isHost: true,
    });
  } catch (error) {
    console.error("[Matchmaking] Find match error:", error);
    return NextResponse.json({ error: "Matchmaking failed. Please try again." }, { status: 500 });
  }
}
