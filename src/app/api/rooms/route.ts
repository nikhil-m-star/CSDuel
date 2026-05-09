import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getResolvedRoomStatus } from "@/lib/room-completion";
import { generateRoomCode } from "@/lib/utils";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default topic since all duels are mixed now
    const topic = "Mixed";

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found. Please sync first." }, { status: 404 });
    }

    // Generate unique room code
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json({ error: "Could not generate unique room code" }, { status: 500 });
    }

    const room = await prisma.room.create({
      data: {
        code,
        topic,
        players: {
          create: {
            userId: user.id,
          },
        },
      },
      include: {
        players: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 100)
      : 10;
    const status = req.nextUrl.searchParams.get("status");

    const rooms = await prisma.room.findMany({
      where: {
        players: {
          some: { userId: user.id },
        },
        ...(status ? { status: status as "WAITING" | "IN_PROGRESS" | "COMPLETED" } : {}),
      },
      include: {
        players: {
          orderBy: { id: "asc" },
          include: { user: true },
        },
        questions: {
          select: {
            id: true,
          },
        },
        answers: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(
      rooms.map((room) => {
        const { answers, questions, ...roomData } = room;
        void answers;
        void questions;

        return {
          ...roomData,
          status: getResolvedRoomStatus(room),
        };
      })
    );
  } catch (error) {
    console.error("Room list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
