import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQuestions } from "@/lib/nvidia";
import { getRecentQuestionHistory } from "@/lib/question-history";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isMember = room.players.some((player) => player.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (room.players[0]?.user.clerkId !== clerkId) {
      return NextResponse.json({ error: "Only the host can generate questions" }, { status: 403 });
    }

    // If questions already exist, return them (idempotent)
    if (room.questions.length > 0) {
      return NextResponse.json({
        questions: room.questions.slice(0, 10).map((question) => ({
          id: question.id,
          roomId: question.roomId,
          topic: question.topic,
          questionText: question.questionText,
          options: question.options,
          explanation: question.explanation,
          orderIndex: question.orderIndex,
        })),
        cached: true,
      });
    }

    const recentQuestionTexts = await getRecentQuestionHistory(
      room.players.map((player) => player.userId)
    );
    const generatedQuestions = await generateQuestions({
      avoidQuestionTexts: recentQuestionTexts,
    });

    await prisma.$transaction(async (tx) => {
      const existingCount = await tx.question.count({
        where: { roomId: room.id },
      });

      if (existingCount === 0) {
        await tx.question.createMany({
          data: generatedQuestions.slice(0, 10).map((q, index) => ({
            roomId: room.id,
            topic: room.topic,
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            orderIndex: index,
          })),
        });
      }
    });

    const savedQuestions = await prisma.question.findMany({
      where: { roomId: room.id },
      orderBy: { orderIndex: "asc" },
      take: 10,
    });

    return NextResponse.json({
      questions: savedQuestions.map((question) => ({
        id: question.id,
        roomId: question.roomId,
        topic: question.topic,
        questionText: question.questionText,
        options: question.options,
        explanation: question.explanation,
        orderIndex: question.orderIndex,
      })),
      cached: false,
    });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions. Please try again." },
      { status: 500 }
    );
  }
}
