import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getResolvedRoomStatus } from "@/lib/room-completion";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { roomId } = await params;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          orderBy: [{ score: "desc" }, { id: "asc" }],
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

    const { answers, ...roomData } = room;
    void answers;

    return NextResponse.json({
      ...roomData,
      status: getResolvedRoomStatus(room),
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
