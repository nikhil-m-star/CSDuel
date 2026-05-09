interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
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

export async function generateQuestions(): Promise<MCQQuestion[]> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_NIM_API_KEY is missing");
  }

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.2-3b-instruct",
      messages: [
        {
          role: "system",
          content:
            "Return only valid raw JSON. No markdown. No explanation outside JSON.",
        },
        {
          role: "user",
          content:
            'Generate exactly 10 unique computer science MCQs for a fast 1v1 quiz duel. Cover DSA, OS, DBMS, CN, and OOP in a balanced way. Return a JSON array only with objects shaped like {"question":"...","options":["...","...","...","..."],"correctAnswer":"A"}. Each question must have exactly 4 options and correctAnswer must be one of A, B, C, D.',
        },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1400,
    }),
    signal: AbortSignal.timeout(12000),
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

  const jsonStr = content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const questions: MCQQuestion[] = JSON.parse(jsonStr);

  if (!Array.isArray(questions) || questions.length < 10) {
    throw new Error("Response is not a valid 10-question array");
  }

  return normalizeQuestions(questions);
}
