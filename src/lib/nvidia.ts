interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface GenerateQuestionsOptions {
  avoidQuestionTexts?: string[];
}

interface ModelAttempt {
  model: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
  topP: number;
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

  return `${avoidSection}Generate exactly 10 concise computer science MCQs for a 1v1 quiz duel. Cover DSA, OOP, DBMS, OS, and CN. Return one compact JSON array only, minified on a single line, with objects like {"question":"...","options":["...","...","...","..."],"correctAnswer":"A"}. Keep question and option text short. Use exactly 4 options. correctAnswer must be A, B, C, or D.`;
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

function buildMessages(prompt: string) {
  return [
    {
      role: "user",
      content: `Return only valid raw JSON. No markdown. No code fences. No explanation.\n\n${prompt}`,
    },
  ];
}

const MODEL_ATTEMPTS: ModelAttempt[] = [
  {
    model: "google/gemma-3n-e4b-it",
    timeoutMs: 24000,
    maxTokens: 700,
    temperature: 0.3,
    topP: 0.85,
  },
  {
    model: "google/gemma-3n-e2b-it",
    timeoutMs: 26000,
    maxTokens: 700,
    temperature: 0.3,
    topP: 0.85,
  },
];

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
    const prompt = buildPrompt(activeAvoidList);

    for (const attempt of MODEL_ATTEMPTS) {
      try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: attempt.model,
            messages: buildMessages(prompt),
            temperature: attempt.temperature,
            top_p: attempt.topP,
            max_tokens: attempt.maxTokens,
          }),
          signal: AbortSignal.timeout(attempt.timeoutMs),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${attempt.model} error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error(`No content in ${attempt.model} response`);
        }

        const jsonStr = extractJsonArray(content);
        const questions: MCQQuestion[] = JSON.parse(jsonStr);

        if (!Array.isArray(questions) || questions.length < 10) {
          throw new Error(`${attempt.model} response is not a valid 10-question array`);
        }

        const normalizedQuestions = normalizeQuestions(questions);
        if (hasDuplicates(normalizedQuestions, activeAvoidList)) {
          throw new Error(`${attempt.model} generated repeated recent questions`);
        }

        return normalizedQuestions;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown question generation error");
      }
    }
  }

  throw lastError ?? new Error("Question generation failed");
}
