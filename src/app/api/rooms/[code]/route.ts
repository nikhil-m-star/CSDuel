import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        players: {
          include: { user: true },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Room get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        players: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "WAITING") {
      return NextResponse.json({ error: "Room is no longer accepting players" }, { status: 400 });
    }

    // Check if already in room
    const existingPlayer = room.players.find((p) => p.userId === user.id);
    if (existingPlayer) {
      return NextResponse.json({ message: "Already in room", room });
    }

    if (room.players.length >= 2) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    await prisma.roomPlayer.create({
      data: {
        roomId: room.id,
        userId: user.id,
      },
    });

    const updatedRoom = await prisma.room.findUnique({
      where: { code },
      include: {
        players: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Room join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
