interface NIMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateQuestions(): Promise<MCQQuestion[]> {
  const systemPrompt = `You are a computer science professor creating quiz questions. You MUST return ONLY a valid JSON array with exactly 10 objects. No markdown, no preamble, no explanation outside the JSON.`;

  const userPrompt = `Generate 10 unique MCQ questions covering a balanced mix of Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, and Object Oriented Programming for a CS quiz duel. 
Return ONLY a JSON array with this structure:
[{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "explanation": "..."
}]
No preamble, no markdown, just raw JSON. The questions should range from intermediate to advanced difficulty. Each question must have exactly 4 options labeled A, B, C, D. The correctAnswer field should be just the letter (A, B, C, or D).`;

  const messages: NIMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages,
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("NVIDIA NIM API error:", errorText);
    throw new Error(`NVIDIA NIM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in NVIDIA NIM response");
  }

  // Extract JSON from the response (handle potential markdown wrapping)
  let jsonStr = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const questions: MCQQuestion[] = JSON.parse(jsonStr);

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Response is not a valid array");
    }

    return questions.slice(0, 10).map((q, i) => ({
      question: q.question || `Question ${i + 1}`,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ["A", "B", "C", "D"],
      correctAnswer: q.correctAnswer || "A",
      explanation: q.explanation || "",
    }));
  } catch (parseError) {
    console.error("Failed to parse NVIDIA NIM response:", jsonStr);
    throw new Error("Failed to parse question JSON from NVIDIA NIM");
  }
}
