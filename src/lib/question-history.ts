import { prisma } from "@/lib/db";

export async function getRecentQuestionHistory(
  userIds: string[],
  limit = 40
): Promise<string[]> {
  if (userIds.length === 0 || limit <= 0) {
    return [];
  }

  const recentAnswers = await prisma.answer.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit * 3,
    include: {
      question: {
        select: {
          questionText: true,
        },
      },
    },
  });

  const seen = new Set<string>();
  const recentQuestions: string[] = [];

  for (const answer of recentAnswers) {
    const questionText = answer.question.questionText.trim();
    const normalized = questionText.toLowerCase();

    if (!questionText || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    recentQuestions.push(questionText);

    if (recentQuestions.length >= limit) {
      break;
    }
  }

  return recentQuestions;
}
