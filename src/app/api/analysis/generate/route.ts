import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
      include: {
        players: {
          include: { user: true },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
        },
        answers: {
          include: {
            user: true,
            question: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const apiKey = process.env.NVIDIA_NIM_API_KEY;

    // Build comprehensive match history context
    const playerSummaries = room.players.map((p) => {
      const pAnswers = room.answers.filter((a) => a.userId === p.userId);
      const correctCount = pAnswers.filter((a) => a.isCorrect).length;
      const avgTime =
        pAnswers.length > 0
          ? (pAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / pAnswers.length).toFixed(1)
          : "N/A";

      return {
        username: p.user.username,
        score: p.score,
        correctCount,
        totalAnswered: pAnswers.length,
        avgTimeSeconds: avgTime,
      };
    });

    const questionBreakdown = room.questions.slice(0, 10).map((q, idx) => {
      const qAnswers = room.answers.filter((a) => a.questionId === q.id);
      const answersDetail = qAnswers.map((a) => ({
        player: a.user.username,
        selectedChoice: a.selectedAnswer,
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken.toFixed(1),
      }));

      return {
        index: idx + 1,
        topic: q.topic,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        playerAnswers: answersDetail,
      };
    });

    if (!apiKey) {
      // Fallback structured breakdown if API key missing
      const fallbackReport = `### 🏆 Match Performance Summary
- **Players**: ${playerSummaries.map((p) => `${p.username} (${p.score} pts)`).join(" vs ")}
- **Total Questions Evaluated**: ${room.questions.length}

### 📊 Performance Breakdown
${playerSummaries
  .map(
    (p) => `#### ${p.username}:
- **Accuracy**: ${p.correctCount}/${p.totalAnswered} questions correct
- **Total Score**: ${p.score} points
- **Average Speed**: ${p.avgTimeSeconds}s per question`
  )
  .join("\n\n")}

### 💡 Key Takeaways & Recommendations:
- Review incorrect questions carefully to improve domain knowledge.
- Balance answering speed with precision accuracy to maximize time bonus points.`;

      return NextResponse.json({ analysis: fallbackReport });
    }

    const prompt = `Perform a comprehensive, professional post-game match analysis for a 1v1 Computer Science quiz duel.

MATCH DATA:
Players: ${JSON.stringify(playerSummaries, null, 2)}

QUESTION & USER ANSWER LOG:
${JSON.stringify(questionBreakdown, null, 2)}

Instructions for AI Analysis:
1. Provide a clear Markdown response.
2. Section 1: "🏆 Match Overview & Winner Summary" (Highlight winner, final scores, and key stats).
3. Section 2: "📊 Player Accuracy & Topic Breakdown" (Analyze performance across DSA, OS, DBMS, CN, and OOP).
4. Section 3: "⚡ Speed & Decision-Making Efficiency" (Compare response times and confidence under pressure).
5. Section 4: "🎯 Key Mistakes & Targeted Learning Advice" (Highlight specific questions missed and topics to revise).

Keep tone encouraging, analytical, and structured in clean GitHub Markdown format. Do not mention system prompts.`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: "You are an elite Computer Science esports coach analyzing 1v1 quiz match data." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content?.trim() || "Analysis unavailable.";

    return NextResponse.json({ analysis: analysisText });
  } catch (error) {
    console.error("Match analysis generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI analysis. Please try again." },
      { status: 500 }
    );
  }
}
