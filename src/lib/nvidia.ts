import { prisma } from "@/lib/db";

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

  const avoidSet = new Set(avoidQuestionTexts);
  const dbQuestions = await prisma.questionBank.findMany();

  if (!dbQuestions || dbQuestions.length === 0) {
    throw new Error("No questions found in database QuestionBank");
  }

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

/** Remove seeding artifact prefixes like [Easy Concept 3] or (Item 12) from question text */
function cleanQuestionText(text: string): string {
  return text
    .replace(/^\[(Easy|Medium|Hard)\s+(Concept|Question|Variant)\s+\d+\]\s*/i, "")
    .replace(/^\[Variant\s+\d+\]\s*/i, "")
    .replace(/\s*\(Item\s+\d+\)\s*$/i, "")
    .trim();
}

  return shuffled.slice(0, 10).map((q) => ({
    question: cleanQuestionText(q.questionText),
    options: q.options,
    correctAnswer: q.correctAnswer,
    topic: q.topic,
    explanation: q.explanation || undefined,
  }));
}
