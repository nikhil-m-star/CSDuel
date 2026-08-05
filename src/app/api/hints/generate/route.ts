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
          include: { players: true },
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

    // If we have an explanation from the seeded DB, derive a smart hint from it without spoiling the answer
    if (!apiKey) {
      const fallback = question.explanation
        ? `💡 Think about this: ${question.explanation.split(".")[0]}.`
        : `Consider the fundamental principles of ${question.topic || "Computer Science"} — eliminate options that don't fit.`;
      return NextResponse.json({ hint: fallback });
    }

    const optionsList = question.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)
      .join("\n");

    const explanationContext = question.explanation
      ? `\nBackground knowledge: ${question.explanation}`
      : "";

    const systemPrompt = `You are a sharp Computer Science professor helping a student during a competitive quiz. 
Your job: give ONE clear, specific, useful hint that guides the student toward the correct answer WITHOUT:
- Stating the correct option letter (A/B/C/D)
- Quoting the exact correct answer text word-for-word
- Being vague or generic ("think carefully", "recall the basics", etc.)

Your hint MUST reference something concrete and specific about the question topic that narrows down the answer. Be direct and educational.`;

    const userPrompt = `Question: ${question.questionText}

Options:
${optionsList}${explanationContext}

Give ONE specific, useful hint (2-3 sentences max) that helps a student eliminate wrong answers and think in the right direction. Be concrete, not vague.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 180,
        temperature: 0.3,
        top_p: 0.9,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const fallback = question.explanation
        ? `💡 ${question.explanation.split(".")[0]}.`
        : `Think about what distinguishes each option in ${question.topic || "this topic"} from one another.`;
      return NextResponse.json({ hint: fallback });
    }

    const data = await response.json();
    let hintText = data.choices?.[0]?.message?.content?.trim() || "";

    // Strip any leaked option letters if model misbehaves
    hintText = hintText.replace(/\b(the answer is|correct answer is|option [A-D] is correct|choose [A-D])\b/gi, "");

    if (!hintText) {
      hintText = question.explanation
        ? `💡 ${question.explanation.split(".")[0]}.`
        : `Focus on the specific technical definition that separates the right answer from plausible-sounding alternatives.`;
    }

    return NextResponse.json({ hint: hintText });
  } catch (error) {
    console.error("Hint generation error:", error);
    return NextResponse.json(
      { hint: "Think carefully about which option is technically precise — one of them is the exact definition, the others are either related concepts or common misconceptions." },
      { status: 200 }
    );
  }
}
