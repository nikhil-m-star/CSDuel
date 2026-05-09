import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getResolvedRoomStatus } from "@/lib/room-completion";

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
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        players: {
          orderBy: { id: "asc" },
          include: { user: true },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        answers: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.players.some((player) => player.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions =
      room.questions.map((question) => ({
        id: question.id,
        roomId: question.roomId,
        topic: question.topic,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        orderIndex: question.orderIndex,
      }));

    const { answers, ...roomData } = room;
    void answers;

    return NextResponse.json({
      ...roomData,
      status: getResolvedRoomStatus(room),
      hostClerkId: room.players[0]?.user.clerkId ?? null,
      questions,
    });
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
        players: {
          orderBy: { id: "asc" },
        },
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

    const playerCount = await prisma.roomPlayer.count({
      where: { roomId: room.id },
    });

    if (playerCount > 2) {
      await prisma.roomPlayer.delete({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    const updatedRoom = await prisma.room.findUnique({
      where: { code },
      include: {
        players: {
          orderBy: { id: "asc" },
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
