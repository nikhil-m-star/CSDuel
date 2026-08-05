import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, questionId } = await req.json();

    if (!roomId || !questionId) {
      return NextResponse.json({ error: "Room ID and Question ID required" }, { status: 400 });
    }

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

    if (!question || question.roomId !== roomId) {
      return NextResponse.json({ error: "Question not found in room" }, { status: 404 });
    }

    const isMember = question.room.players.some((p) => p.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        hint: `Think about the core concept of ${question.topic || "Computer Science"} and eliminate unlikely options.`,
      });
    }

    const prompt = `Question: "${question.questionText}"
Options: ${question.options.join(", ")}

Provide a single, short, 1-sentence subtle conceptual hint for a student trying to answer this computer science question. DO NOT state the correct option letter (A, B, C, or D) or reveal the exact answer option string.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: "You are a helpful Computer Science tutor giving subtle 1-sentence hints." },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return NextResponse.json({
        hint: `Focus on the fundamental principles of ${question.topic || "this topic"} to find the right choice.`,
      });
    }

    const data = await response.json();
    const hintText =
      data.choices?.[0]?.message?.content?.trim() ||
      `Focus on the key concepts of ${question.topic || "this topic"}.`;

    return NextResponse.json({ hint: hintText });
  } catch (error) {
    console.error("Hint generation error:", error);
    return NextResponse.json(
      { hint: "Recall the standard definitions and edge cases for this topic." },
      { status: 200 }
    );
  }
}
