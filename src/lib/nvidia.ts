import { prisma } from "@/lib/db";
import { getRandomFallbackQuestions } from "@/lib/fallback-questions";

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic?: string;
  explanation?: string;
}

export interface GenerateQuestionsOptions {
  avoidQuestionTexts?: string[];
}

export async function generateQuestions(
  options: GenerateQuestionsOptions = {}
): Promise<MCQQuestion[]> {
  const avoidQuestionTexts = (options.avoidQuestionTexts ?? [])
    .map((question) => question.trim().toLowerCase())
    .filter(Boolean);

  try {
    const avoidSet = new Set(avoidQuestionTexts);
    const dbQuestions = await prisma.questionBank.findMany();

    if (dbQuestions && dbQuestions.length > 0) {
      const eligible = dbQuestions.filter(
        (q) => !avoidSet.has(q.questionText.trim().toLowerCase())
      );

      const pool = eligible.length >= 10 ? eligible : dbQuestions;

      // Fisher-Yates shuffle
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled.slice(0, 10).map((q) => ({
        question: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        topic: q.topic,
        explanation: q.explanation || undefined,
      }));
    }
  } catch (error) {
    console.warn("Error fetching questions from database QuestionBank, falling back to static pool:", error);
  }

  return getRandomFallbackQuestions(10, avoidQuestionTexts);
}
