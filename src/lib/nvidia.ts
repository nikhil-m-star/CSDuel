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

const FALLBACK_QUESTIONS: MCQQuestion[] = [
  {
    question: "Which data structure guarantees O(1) average-time lookup by key?",
    options: ["Balanced BST", "Hash table", "Binary heap", "Linked list"],
    correctAnswer: "B",
    explanation: "Hash tables provide O(1) average lookup time when the hash function distributes keys well.",
  },
  {
    question: "What is the main purpose of virtual memory in an operating system?",
    options: ["To speed up CPU clock cycles", "To replace file systems", "To give each process an isolated logical address space", "To disable paging"],
    correctAnswer: "C",
    explanation: "Virtual memory isolates processes and maps logical addresses to physical memory as needed.",
  },
  {
    question: "Which normal form removes transitive dependencies from a relation?",
    options: ["First Normal Form", "Second Normal Form", "Third Normal Form", "Boyce-Codd Normal Form"],
    correctAnswer: "C",
    explanation: "Third Normal Form eliminates transitive dependencies on non-key attributes.",
  },
  {
    question: "Which transport-layer protocol provides ordered, reliable byte streams?",
    options: ["UDP", "IP", "TCP", "ARP"],
    correctAnswer: "C",
    explanation: "TCP provides reliable, ordered delivery with retransmission and flow control.",
  },
  {
    question: "Which OOP principle allows one interface to support multiple underlying forms?",
    options: ["Encapsulation", "Polymorphism", "Inheritance", "Abstraction"],
    correctAnswer: "B",
    explanation: "Polymorphism lets code operate through a common interface while behavior varies by concrete type.",
  },
  {
    question: "What is the worst-case time complexity of binary search on a sorted array?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "B",
    explanation: "Binary search halves the remaining search space on each step.",
  },
  {
    question: "Which scheduling algorithm can suffer from starvation without aging?",
    options: ["Round Robin", "Shortest Job First", "Priority Scheduling", "FCFS"],
    correctAnswer: "C",
    explanation: "Strict priority scheduling may indefinitely delay lower-priority jobs unless aging is used.",
  },
  {
    question: "What does an index in a relational database primarily improve?",
    options: ["Write amplification", "Query lookup speed", "Tuple normalization", "Transaction isolation level"],
    correctAnswer: "B",
    explanation: "Indexes speed up row lookup, filtering, and joins at the cost of extra storage and write overhead.",
  },
  {
    question: "Which device forwards packets between different IP networks?",
    options: ["Switch", "Repeater", "Router", "Hub"],
    correctAnswer: "C",
    explanation: "Routers operate at the network layer and forward packets across networks.",
  },
  {
    question: "Which concept hides implementation details and exposes only essential behavior?",
    options: ["Inheritance", "Polymorphism", "Abstraction", "Composition"],
    correctAnswer: "C",
    explanation: "Abstraction focuses on what an object does rather than how it is implemented.",
  },
];

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
    explanation: q.explanation || "",
  }));
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

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  if (!apiKey) {
    console.warn("NVIDIA_NIM_API_KEY is missing. Falling back to bundled questions.");
    return FALLBACK_QUESTIONS;
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(20000),
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

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const questions: MCQQuestion[] = JSON.parse(jsonStr);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Response is not a valid array");
    }

    return normalizeQuestions(questions);
  } catch (error) {
    console.error("Question generation failed, using fallback questions:", error);
    return FALLBACK_QUESTIONS;
  }
}
