import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQuestions } from "@/lib/nvidia";
import { getRecentQuestionHistory } from "@/lib/question-history";

export async function POST(req: Request) {
  try {
    const { roomId, roomCode, clerkId, secret } = await req.json();
    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;

    if (!configuredInternalSecret || secret !== configuredInternalSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof roomId !== "string" || typeof roomCode !== "string") {
      return NextResponse.json({ error: "Room details are required" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        questions: true,
        players: {
          orderBy: { id: "asc" },
          include: { user: true },
        },
      },
    });

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.code !== roomCode) {
      return NextResponse.json({ error: "Room mismatch" }, { status: 400 });
    }

    if (room.players.length < 1) {
      return NextResponse.json({ error: "At least one player is required to start a duel" }, { status: 400 });
    }

    // Only enforce host restriction when there are multiple players
    if (room.players.length > 1) {
      const hostClerkId = room.players[0]?.user.clerkId;
      if (typeof clerkId === "string" && hostClerkId && clerkId !== hostClerkId) {
        return NextResponse.json({ error: "Only the host can start the duel" }, { status: 403 });
      }
    }

    if (room.status === "COMPLETED") {
      return NextResponse.json({ error: "Room is already completed" }, { status: 400 });
    }

    if (room.questions.length > 0) {
      if (room.status !== "IN_PROGRESS") {
        await prisma.room.update({
          where: { id: room.id },
          data: { status: "IN_PROGRESS" },
        });
      }

      return NextResponse.json({ success: true, message: "Questions already exist" });
    }

    const recentQuestionTexts = await getRecentQuestionHistory(
      room.players.map((player) => player.userId)
    );
    const questions = await generateQuestions({
      avoidQuestionTexts: recentQuestionTexts,
    });
    
    await prisma.$transaction(async (tx) => {
      const existingCount = await tx.question.count({
        where: { roomId: room.id },
      });

      if (existingCount === 0) {
        await tx.question.createMany({
          data: questions.slice(0, 10).map((q, i) => ({
            roomId: room.id,
            topic: room.topic || "Mixed",
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            orderIndex: i,
          })),
        });
      }

      if (room.status !== "IN_PROGRESS") {
        await tx.room.update({
          where: { id: room.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal question generation error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
