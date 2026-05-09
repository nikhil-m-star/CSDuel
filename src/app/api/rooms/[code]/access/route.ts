import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { clerkId, secret } = await req.json();
    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;

    if (!configuredInternalSecret || secret !== configuredInternalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof clerkId !== "string") {
      return NextResponse.json({ error: "Invalid clerkId" }, { status: 400 });
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
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.players.some((player) => player.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      allowed: true,
      status: room.status,
      roomId: room.id,
      hostClerkId: room.players[0]?.user.clerkId ?? null,
    });
  } catch (error) {
    console.error("Room access validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
