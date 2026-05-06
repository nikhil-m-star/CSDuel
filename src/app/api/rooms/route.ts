import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRoomCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic } = await req.json();

    if (!topic || !["DSA", "OS", "DBMS", "CN"].includes(topic)) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

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

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: {
        players: {
          some: { userId: user.id },
        },
      },
      include: {
        players: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Room list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
