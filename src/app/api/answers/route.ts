import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, questionId, selectedAnswer, timeTaken } = await req.json();

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    const score = calculateScore(isCorrect, timeTaken);

    // Upsert answer (in case of retries)
    const answer = await prisma.answer.upsert({
      where: {
        roomId_userId_questionId: {
          roomId,
          userId: user.id,
          questionId,
        },
      },
      update: {
        selectedAnswer,
        isCorrect,
        timeTaken,
        score,
      },
      create: {
        roomId,
        userId: user.id,
        questionId,
        selectedAnswer,
        isCorrect,
        timeTaken,
        score,
      },
    });

    // Update total player score
    const totalScore = await prisma.answer.aggregate({
      where: { roomId, userId: user.id },
      _sum: { score: true },
    });

    await prisma.roomPlayer.update({
      where: {
        roomId_userId: { roomId, userId: user.id },
      },
      data: {
        score: totalScore._sum.score || 0,
      },
    });

    return NextResponse.json({
      answer,
      isCorrect,
      score,
      totalScore: totalScore._sum.score || 0,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Answer submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
