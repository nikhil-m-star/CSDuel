interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QUESTION_BANK: MCQQuestion[] = [
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
  {
    question: "Which traversal visits nodes in the order left subtree, root, right subtree?",
    options: ["Preorder", "Inorder", "Postorder", "Level order"],
    correctAnswer: "B",
    explanation: "Inorder traversal processes left subtree, then root, then right subtree.",
  },
  {
    question: "What is a page fault?",
    options: ["A CPU arithmetic exception", "An invalid DNS response", "An interrupt raised when a referenced page is not in memory", "A deadlock detection event"],
    correctAnswer: "C",
    explanation: "A page fault occurs when the OS must load a needed memory page into RAM.",
  },
  {
    question: "Which SQL command removes all rows from a table while keeping the table structure?",
    options: ["DROP", "DELETE DATABASE", "TRUNCATE", "REMOVE"],
    correctAnswer: "C",
    explanation: "TRUNCATE clears rows while preserving the table definition.",
  },
  {
    question: "Which protocol resolves a domain name to an IP address?",
    options: ["DHCP", "DNS", "FTP", "SMTP"],
    correctAnswer: "B",
    explanation: "DNS translates human-readable domain names into IP addresses.",
  },
  {
    question: "Which principle is best represented by keeping object fields private and exposing methods to access them?",
    options: ["Inheritance", "Encapsulation", "Polymorphism", "Overloading"],
    correctAnswer: "B",
    explanation: "Encapsulation bundles data with the methods that operate on it and restricts direct access.",
  },
  {
    question: "What is the time complexity of inserting an element into a binary heap?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "B",
    explanation: "Heap insertion may bubble the new element up through the height of the heap.",
  },
  {
    question: "Which concurrency issue occurs when two threads wait forever for each other to release resources?",
    options: ["Starvation", "Race condition", "Deadlock", "Thrashing"],
    correctAnswer: "C",
    explanation: "Deadlock is the condition where threads or processes are stuck waiting on each other indefinitely.",
  },
  {
    question: "Which join returns only rows with matching values in both tables?",
    options: ["LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "INNER JOIN"],
    correctAnswer: "D",
    explanation: "INNER JOIN includes only rows that match in both joined tables.",
  },
  {
    question: "What field in an IPv4 packet prevents it from circulating forever?",
    options: ["Port", "Checksum", "Time To Live", "Sequence Number"],
    correctAnswer: "C",
    explanation: "TTL decreases at each hop and the packet is discarded when it reaches zero.",
  },
  {
    question: "Which OOP relationship is usually preferred over inheritance for flexibility?",
    options: ["Composition", "Aggregation by interface only", "Friendship", "Static binding"],
    correctAnswer: "A",
    explanation: "Composition is often preferred because it reduces tight coupling and allows behavior assembly.",
  },
];

function shuffleQuestions<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
    explanation: q.explanation || "",
  }));
}

export async function generateQuestions(): Promise<MCQQuestion[]> {
  return normalizeQuestions(shuffleQuestions(QUESTION_BANK));
}
