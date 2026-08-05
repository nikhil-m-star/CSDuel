import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRoomCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userIds, secret } = body;
    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;

    if (!configuredInternalSecret || secret !== configuredInternalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Array.isArray(userIds) || userIds.length < 2 || new Set(userIds).size < 2) {
      return NextResponse.json({ error: "Exactly two unique users are required" }, { status: 400 });
    }

    const [clerkIdA, clerkIdB] = userIds as string[];

    // Look up both users — they must exist (ensureUserSynced is called before find-match)
    const users = await prisma.user.findMany({
      where: { clerkId: { in: [clerkIdA, clerkIdB] } },
      select: { id: true, clerkId: true },
    });

    if (users.length !== 2) {
      const missing = [clerkIdA, clerkIdB].filter(id => !users.find(u => u.clerkId === id));
      console.error("[Matchmaking] Missing users:", missing);
      return NextResponse.json(
        { error: `User not synced: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Generate a unique room code
    let finalRoomCode = "";
    for (let i = 0; i < 10; i++) {
      const candidate = generateRoomCode();
      const existing = await prisma.room.findUnique({ where: { code: candidate } });
      if (!existing) { finalRoomCode = candidate; break; }
    }

    if (!finalRoomCode) {
      return NextResponse.json({ error: "Could not generate unique room code" }, { status: 500 });
    }

    const room = await prisma.room.create({
      data: {
        code: finalRoomCode,
        topic: "Mixed",
        status: "WAITING",
        players: {
          create: users.map((u) => ({ userId: u.id })),
        },
      },
    });

    console.log(`[Matchmaking] Room ${room.code} created for ${clerkIdA} ↔ ${clerkIdB}`);
    return NextResponse.json({ success: true, roomId: room.id, roomCode: room.code });
  } catch (error) {
    console.error("[Matchmaking] Room creation error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
