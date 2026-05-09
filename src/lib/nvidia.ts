interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface GenerateQuestionsOptions {
  avoidQuestionTexts?: string[];
}

function normalizeQuestions(questions: MCQQuestion[]): MCQQuestion[] {
  return questions.slice(0, 10).map((q, i) => ({
    question: q.question || `Question ${i + 1}`,
    options:
      Array.isArray(q.options) && q.options.length >= 4
        ? q.options.slice(0, 4)
        : ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer:
      typeof q.correctAnswer === "string" && /^[A-D]$/.test(q.correctAnswer.toUpperCase())
        ? q.correctAnswer.toUpperCase()
        : "A",
  }));
}

function buildPrompt(avoidQuestionTexts: string[]): string {
  const avoidSection =
    avoidQuestionTexts.length > 0
      ? `Do not reuse or closely paraphrase these recent duel questions:\n${avoidQuestionTexts
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n")}\n`
      : "";

  return `${avoidSection}Generate exactly 10 unique computer science MCQs for a fast 1v1 quiz duel. Keep the wording concise. Spread questions across DSA, OOP, DBMS, OS, and computer networks. Return only a JSON array with objects shaped like {"question":"...","options":["...","...","...","..."],"correctAnswer":"A"}. Use exactly 4 options and set correctAnswer to A, B, C, or D.`;
}

function extractJsonArray(rawContent: string): string {
  const withoutCodeFences = rawContent
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "");
  const startIndex = withoutCodeFences.indexOf("[");
  const endIndex = withoutCodeFences.lastIndexOf("]");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("No JSON array found in model response");
  }

  return withoutCodeFences.slice(startIndex, endIndex + 1);
}

function hasDuplicates(questions: MCQQuestion[], avoidQuestionTexts: string[]): boolean {
  const normalizedAvoid = new Set(
    avoidQuestionTexts.map((question) => question.trim().toLowerCase())
  );
  const seen = new Set<string>();

  for (const question of questions) {
    const normalized = question.question.trim().toLowerCase();
    if (!normalized || seen.has(normalized) || normalizedAvoid.has(normalized)) {
      return true;
    }
    seen.add(normalized);
  }

  return false;
}

export async function generateQuestions(
  options: GenerateQuestionsOptions = {}
): Promise<MCQQuestion[]> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_NIM_API_KEY is missing");
  }

  const avoidQuestionTexts = (options.avoidQuestionTexts ?? [])
    .map((question) => question.trim())
    .filter(Boolean);
  const exclusionWindows = Array.from(
    new Set([
      Math.min(18, avoidQuestionTexts.length),
      Math.min(8, avoidQuestionTexts.length),
      0,
    ])
  );

  let lastError: Error | null = null;

  for (const exclusionWindow of exclusionWindows) {
    const activeAvoidList =
      exclusionWindow > 0 ? avoidQuestionTexts.slice(0, exclusionWindow) : [];

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemma-3n-e4b-it",
          messages: [
            {
              role: "user",
              content: `Return only valid raw JSON. No markdown. No explanation outside JSON.\n\n${buildPrompt(activeAvoidList)}`,
            },
          ],
          temperature: 0.45,
          top_p: 0.9,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA NIM API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in NVIDIA NIM response");
      }

      const jsonStr = extractJsonArray(content);
      const questions: MCQQuestion[] = JSON.parse(jsonStr);

      if (!Array.isArray(questions) || questions.length < 10) {
        throw new Error("Response is not a valid 10-question array");
      }

      const normalizedQuestions = normalizeQuestions(questions);
      if (hasDuplicates(normalizedQuestions, activeAvoidList)) {
        throw new Error("Generated questions repeated recent user history");
      }

      return normalizedQuestions;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown question generation error");
    }
  }

  throw lastError ?? new Error("Question generation failed");
}
