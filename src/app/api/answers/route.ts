import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      roomId,
      questionId,
      selectedAnswer,
      timeTaken,
      clerkId: internalClerkId,
      secret,
    } = body;

    const configuredInternalSecret = process.env.SOCKET_INTERNAL_SECRET;
    const isInternalRequest = typeof secret !== "undefined" || typeof internalClerkId === "string";

    let clerkId: string | null = null;
    if (isInternalRequest) {
      if (!configuredInternalSecret || secret !== configuredInternalSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      clerkId = typeof internalClerkId === "string" ? internalClerkId : null;
    } else {
      const authResult = await auth();
      clerkId = authResult.userId;
    }

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (typeof roomId !== "string" || typeof questionId !== "string") {
      return NextResponse.json({ error: "Invalid room or question" }, { status: 400 });
    }

    const normalizedAnswer =
      typeof selectedAnswer === "string" ? selectedAnswer.trim().toUpperCase() : "";
    if (!["A", "B", "C", "D", "TIMEOUT"].includes(normalizedAnswer)) {
      return NextResponse.json({ error: "Invalid answer choice" }, { status: 400 });
    }

    const normalizedTimeTaken = Number.isFinite(Number(timeTaken))
      ? Math.max(0, Math.min(30, Number(timeTaken)))
      : 30;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        room: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    if (question.roomId !== roomId) {
      return NextResponse.json({ error: "Question does not belong to this room" }, { status: 400 });
    }

    if (question.room.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Room is not accepting answers" }, { status: 400 });
    }

    const roomPlayer = question.room.players.find((player) => player.userId === user.id);
    if (!roomPlayer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingAnswer = await prisma.answer.findUnique({
      where: {
        roomId_userId_questionId: {
          roomId,
          userId: user.id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      return NextResponse.json({
        accepted: false,
        alreadyAnswered: true,
        answer: existingAnswer,
        isCorrect: existingAnswer.isCorrect,
        score: existingAnswer.score,
        totalScore: roomPlayer.score,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }

    const isCorrect = normalizedAnswer !== "TIMEOUT" && normalizedAnswer === question.correctAnswer;
    const score = calculateScore(isCorrect, normalizedTimeTaken);

    const created = await prisma.$transaction(async (tx) => {
      const answer = await tx.answer.create({
        data: {
          roomId,
          userId: user.id,
          questionId,
          selectedAnswer: normalizedAnswer,
          isCorrect,
          timeTaken: normalizedTimeTaken,
          score,
        },
      });

      const updatedPlayer = await tx.roomPlayer.update({
        where: {
          roomId_userId: {
            roomId,
            userId: user.id,
          },
        },
        data: {
          score: {
            increment: score,
          },
        },
      });

      return { answer, totalScore: updatedPlayer.score };
    });

    return NextResponse.json({
      accepted: true,
      alreadyAnswered: false,
      answer: created.answer,
      isCorrect,
      score,
      totalScore: created.totalScore,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("Answer submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
