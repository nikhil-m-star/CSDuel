import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQuestions } from "@/lib/nvidia";

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

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { questions: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // If questions already exist, return them (idempotent)
    if (room.questions.length > 0) {
      return NextResponse.json({
        questions: room.questions,
        cached: true,
      });
    }

    // Generate new questions via NVIDIA NIM
    const generatedQuestions = await generateQuestions();

    // Store questions in DB
    const savedQuestions = await Promise.all(
      generatedQuestions.map((q, index) =>
        prisma.question.create({
          data: {
            roomId: room.id,
            topic: room.topic,
            questionText: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            orderIndex: index,
          },
        })
      )
    );

    return NextResponse.json({
      questions: savedQuestions,
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
