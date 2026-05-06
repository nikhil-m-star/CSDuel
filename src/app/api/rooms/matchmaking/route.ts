import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { roomCode, userIds, secret } = await req.json();

    // Secure the internal endpoint
    if (secret !== process.env.SOCKET_INTERNAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        code: roomCode,
        topic: "Mixed",
        status: "WAITING",
        players: {
          create: userIds.map((clerkId: string) => ({
            user: { connect: { clerkId } }
          }))
        }
      }
    });

    return NextResponse.json({ success: true, roomId: room.id });
  } catch (error) {
    console.error("Internal matchmaking room creation error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
