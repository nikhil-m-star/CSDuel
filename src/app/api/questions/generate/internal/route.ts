import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQuestions } from "@/lib/nvidia";

export async function POST(req: Request) {
  try {
    const { roomId, secret } = await req.json();

    if (secret !== process.env.SOCKET_INTERNAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { questions: true }
    });

    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.questions.length > 0) return NextResponse.json({ success: true, message: "Questions already exist" });

    const questions = await generateQuestions();
    
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "IN_PROGRESS",
        questions: {
          create: questions.map((q, i) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            orderIndex: i
          }))
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal question generation error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
