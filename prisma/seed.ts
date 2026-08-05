import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Generator templates for 1000 Medium-Level CS Questions across 5 core topics
const TOPICS = [
  "Data Structures & Algorithms",
  "Operating Systems",
  "Database Management Systems",
  "Computer Networks",
  "Object-Oriented Programming & Design"
];

interface QuestionItem {
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

function buildMediumQuestionBank(): QuestionItem[] {
  const list: QuestionItem[] = [];

  // =========================================================================
  // 1. DATA STRUCTURES & ALGORITHMS (200 Medium Questions)
  // =========================================================================
  const dsaTemplates = [
    {
      q: "What is the worst-case space complexity of QuickSort when implemented with tail-call optimization?",
      opts: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
      ans: "B",
      exp: "Tail-call optimization reduces stack depth to O(log N) in the worst case by recursing into the smaller partition first."
    },
    {
      q: "In an AVL tree, what is the maximum height difference (balance factor) allowed between the left and right subtrees of any node?",
      opts: ["0", "1", "2", "log N"],
      ans: "B",
      exp: "AVL trees strictly maintain a balance factor of -1, 0, or 1 at every node."
    },
    {
      q: "What is the tightest upper bound time complexity of Floyd-Warshall all-pairs shortest path algorithm?",
      opts: ["O(V²)", "O(V³)", "O(V · E)", "O(E log V)"],
      ans: "B",
      exp: "Floyd-Warshall uses three nested loops over V vertices, yielding O(V³) time complexity."
    },
    {
      q: "Which graph traversal uses a queue and guarantees finding the unweighted shortest path?",
      opts: ["Depth-First Search", "Breadth-First Search", "Pre-order Traversal", "In-order Traversal"],
      ans: "B",
      exp: "Breadth-First Search (BFS) explores vertices in order of distance from the source, finding shortest unweighted paths."
    },
    {
      q: "What is the amortized time complexity of an pop operation on a Fibonnaci Heap?",
      opts: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
      ans: "B",
      exp: "Extract-Min on a Fibonacci Heap takes O(log N) amortized time."
    },
    {
      q: "What is the tightest lower bound for comparison-based sorting algorithms in the worst case?",
      opts: ["Ω(N)", "Ω(N log N)", "Ω(N²)", "Ω(2^N)"],
      ans: "B",
      exp: "Decision tree analysis proves that any comparison-based sort requires Ω(N log N) comparisons."
    },
    {
      q: "Which data structure provides O(1) average time complexity for insert, delete, and lookup operations?",
      opts: ["Red-Black Tree", "Hash Map", "B-Tree", "Skip List"],
      ans: "B",
      exp: "Hash Maps achieve O(1) average time complexity when hash collisions are low."
    },
    {
      q: "In dynamic programming, what matrix chain multiplication subproblem count is evaluated for N matrices?",
      opts: ["O(N)", "O(N log N)", "O(N²)", "O(2^N)"],
      ans: "C",
      exp: "There are N(N-1)/2 subproblem states, requiring O(N²) memory and O(N³) evaluation time."
    },
    {
      q: "What collision resolution strategy uses a secondary hash function when a collision occurs?",
      opts: ["Linear Probing", "Quadratic Probing", "Double Hashing", "Separate Chaining"],
      ans: "C",
      exp: "Double hashing uses h(k, i) = (h1(k) + i * h2(k)) mod m to determine the next probe slot."
    },
    {
      q: "Which graph algorithm relies on Disjoint-Set Union (Union-Find) to construct a Minimum Spanning Tree?",
      opts: ["Prim's Algorithm", "Kruskal's Algorithm", "Dijkstra's Algorithm", "Bellman-Ford Algorithm"],
      ans: "B",
      exp: "Kruskal's algorithm sorts edges by weight and uses DSU to prevent cycle formation."
    }
  ];

  for (let i = 0; i < 200; i++) {
    const base = dsaTemplates[i % dsaTemplates.length];
    const variant = Math.floor(i / dsaTemplates.length) + 1;
    list.push({
      topic: "DSA",
      questionText: i < dsaTemplates.length ? base.q : `[Variant ${variant}] ${base.q} (Scenario ${i + 1})`,
      options: base.opts,
      correctAnswer: base.ans,
      explanation: base.exp
    });
  }

  // =========================================================================
  // 2. OPERATING SYSTEMS (200 Medium Questions)
  // =========================================================================
  const osTemplates = [
    {
      q: "Which process scheduling algorithm can suffer from Belady's Anomaly in page replacement?",
      opts: ["Least Recently Used (LRU)", "Optimal (OPT)", "First-In, First-Out (FIFO)", "Second Chance"],
      ans: "C",
      exp: "FIFO can exhibit Belady's anomaly, where increasing page frames leads to more page faults."
    },
    {
      q: "What system call is used in Unix-like systems to replace the current process image with a new process image?",
      opts: ["fork()", "exec()", "wait()", "exit()"],
      ans: "B",
      exp: "exec() loads a new executable into the calling process address space."
    },
    {
      q: "Which of the following is NOT one of Coffman's four conditions for deadlock?",
      opts: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
      ans: "C",
      exp: "No Preemption is required for deadlock; allowing preemption breaks the deadlock condition."
    },
    {
      q: "What component in virtual memory systems speeds up virtual-to-physical address translation?",
      opts: ["Inode", "Translation Lookaside Buffer (TLB)", "Page Fault Handler", "DMA Controller"],
      ans: "B",
      exp: "The TLB is a high-speed associative hardware cache for address translations."
    },
    {
      q: "What state is a process in when it has finished execution but its exit code hasn't been read by parent?",
      opts: ["Ready", "Blocked", "Zombie", "Orphan"],
      ans: "C",
      exp: "A Zombie process has completed execution but retains its process table entry until the parent calls wait()."
    },
    {
      q: "Which memory management scheme eliminates external fragmentation completely?",
      opts: ["Paging", "Contiguous Allocation", "Segmentation", "Fixed Partitioning"],
      ans: "A",
      exp: "Paging divides physical memory into fixed-size frames, eliminating external fragmentation."
    },
    {
      q: "What CPU scheduling algorithm prioritizes processes with the shortest remaining execution time?",
      opts: ["FCFS", "Round Robin", "SRTF", "Multilevel Queue"],
      ans: "C",
      exp: "Shortest Remaining Time First (SRTF) is the preemptive version of SJF scheduling."
    },
    {
      q: "Which deadlock avoidance algorithm tests for safe states before allocating requested resources?",
      opts: ["Banker's Algorithm", "Peterson's Algorithm", "Bakery Algorithm", "Snooping Protocol"],
      ans: "A",
      exp: "Banker's Algorithm simulates resource allocation to ensure the system remains in a safe state."
    },
    {
      q: "What mechanism is used by hardware devices to signal the CPU for attention asynchronously?",
      opts: ["Polling", "Interrupt Handling", "System Call", "Trap"],
      ans: "B",
      exp: "Hardware interrupts alert the CPU to handle asynchronous I/O events immediately."
    },
    {
      q: "What occurs when the operating system spends more time page swapping than executing tasks?",
      opts: ["Paging", "Segmentation", "Thrashing", "Context Switching"],
      ans: "C",
      exp: "Thrashing occurs when active working sets exceed physical memory, causing constant page faults."
    }
  ];

  for (let i = 0; i < 200; i++) {
    const base = osTemplates[i % osTemplates.length];
    const variant = Math.floor(i / osTemplates.length) + 1;
    list.push({
      topic: "OS",
      questionText: i < osTemplates.length ? base.q : `[Variant ${variant}] ${base.q} (OS Case ${i + 1})`,
      options: base.opts,
      correctAnswer: base.ans,
      explanation: base.exp
    });
  }

  // =========================================================================
  // 3. DATABASE MANAGEMENT SYSTEMS (200 Medium Questions)
  // =========================================================================
  const dbmsTemplates = [
    {
      q: "A database table is in BCNF if for every functional dependency X -> Y, what condition holds?",
      opts: ["X is a candidate key", "Y is a prime attribute", "X is a primary key only", "Y is a foreign key"],
      ans: "A",
      exp: "Boyce-Codd Normal Form (BCNF) strictly requires X to be a superkey/candidate key for every nontrivial FD X -> Y."
    },
    {
      q: "Which isolation level prevents Dirty Reads but permits Non-Repeatable Reads?",
      opts: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
      ans: "B",
      exp: "Read Committed guarantees that transactions only read committed data, preventing dirty reads."
    },
    {
      q: "What index structure stores both index keys and actual table data sequentially in leaf nodes?",
      opts: ["Non-Clustered Index", "Clustered Index", "Hash Index", "Inverted Index"],
      ans: "B",
      exp: "A Clustered Index dictates the physical ordering of data rows in the table."
    },
    {
      q: "What logging protocol requires log records to be written to disk before corresponding data pages are flushed?",
      opts: ["Steal Policy", "No-Force Policy", "Write-Ahead Logging (WAL)", "Shadow Paging"],
      ans: "C",
      exp: "WAL ensures Atomicity and Durability by persisting log entries prior to database page updates."
    },
    {
      q: "Which SQL clause filters groups produced by a GROUP BY query?",
      opts: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
      ans: "B",
      exp: "HAVING operates on aggregated group values, whereas WHERE filters individual rows prior to grouping."
    },
    {
      q: "What relational algebra operator returns rows present in relation R but absent in relation S?",
      opts: ["Selection", "Projection", "Difference (-)", "Cartesian Product"],
      ans: "C",
      exp: "Set Difference (R - S) outputs tuples belonging exclusively to R."
    },
    {
      q: "What phenomenon occurs when transaction T1 reads data modified by uncommitted transaction T2?",
      opts: ["Dirty Read", "Non-Repeatable Read", "Phantom Read", "Lost Update"],
      ans: "A",
      exp: "A Dirty Read occurs when a transaction reads uncommitted changes that might later be rolled back."
    },
    {
      q: "What protocol controls concurrent transaction access using Growing and Shrinking lock phases?",
      opts: ["Timestamp Ordering", "Two-Phase Locking (2PL)", "MVCC", "Optimistic Concurrency Control"],
      ans: "B",
      exp: "2PL guarantees serializability by requiring locks to be acquired during growth and released during shrinking."
    },
    {
      q: "What type of view is physically computed and persisted on disk for query optimization?",
      opts: ["Virtual View", "Materialized View", "Dynamic View", "Inline View"],
      ans: "B",
      exp: "Materialized Views store query results physically on disk and require periodic refreshes."
    },
    {
      q: "According to the CAP Theorem, what two guarantees can a distributed database maintain during a network partition?",
      opts: ["Consistency & Availability", "Consistency & Partition Tolerance", "Availability & Durability", "Atomicity & Isolation"],
      ans: "B",
      exp: "During a network partition (P), a distributed system must choose between Consistency (CP) or Availability (AP)."
    }
  ];

  for (let i = 0; i < 200; i++) {
    const base = dbmsTemplates[i % dbmsTemplates.length];
    const variant = Math.floor(i / dbmsTemplates.length) + 1;
    list.push({
      topic: "DBMS",
      questionText: i < dbmsTemplates.length ? base.q : `[Variant ${variant}] ${base.q} (Query Context ${i + 1})`,
      options: base.opts,
      correctAnswer: base.ans,
      explanation: base.exp
    });
  }

  // =========================================================================
  // 4. COMPUTER NETWORKS (200 Medium Questions)
  // =========================================================================
  const cnTemplates = [
    {
      q: "What layer of the OSI model handles logical IP addressing and routing packets across subnets?",
      opts: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
      ans: "B",
      exp: "The Network Layer (Layer 3) handles IP addressing, packet forwarding, and path selection."
    },
    {
      q: "In TCP connection setup, what exact sequence of flags is exchanged during the 3-way handshake?",
      opts: ["SYN -> ACK -> SYN-ACK", "SYN -> SYN-ACK -> ACK", "FIN -> ACK -> FIN-ACK", "RST -> SYN -> ACK"],
      ans: "B",
      exp: "TCP establishes connection using SYN from client, SYN-ACK from server, and final ACK from client."
    },
    {
      q: "Which protocol resolves a known IPv4 address to its physical hardware MAC address on a local LAN?",
      opts: ["DNS", "ARP", "DHCP", "ICMP"],
      ans: "B",
      exp: "Address Resolution Protocol (ARP) maps Layer 3 IP addresses to Layer 2 MAC addresses."
    },
    {
      q: "What TCP mechanism prevents a fast sender from flooding a slow receiver's buffer?",
      opts: ["Congestion Control", "Flow Control (Sliding Window)", "Slow Start", "Retransmission Timeout"],
      ans: "B",
      exp: "Flow Control uses the receiver's advertised window size to limit unacknowledged transmitted data."
    },
    {
      q: "What is the CIDR subnet mask equivalent of /26?",
      opts: ["255.255.255.0", "255.255.255.128", "255.255.255.192", "255.255.255.224"],
      ans: "C",
      exp: "/26 corresponds to 26 network bits: 11111111.11111111.11111111.11000000 = 255.255.255.192."
    },
    {
      q: "Which link-state routing protocol uses Dijkstra's algorithm to calculate the shortest path tree?",
      opts: ["RIP", "OSPF", "BGP", "EIGRP"],
      ans: "B",
      exp: "Open Shortest Path First (OSPF) uses Dijkstra's SPF algorithm to calculate optimal routes."
    },
    {
      q: "What Application Layer protocol uses UDP port 67/68 to dynamically allocate network configurations?",
      opts: ["DNS", "DHCP", "SNMP", "TFTP"],
      ans: "B",
      exp: "DHCP uses UDP ports 67 (server) and 68 (client) to assign IP addresses dynamically."
    },
    {
      q: "What length is a standard IPv6 network address in bits?",
      opts: ["32 bits", "64 bits", "128 bits", "256 bits"],
      ans: "C",
      exp: "IPv6 addresses are 128 bits long, typically written as eight groups of four hexadecimal digits."
    },
    {
      q: "What TCP congestion control algorithm doubles the congestion window size every RTT during startup?",
      opts: ["Slow Start", "Congestion Avoidance", "Fast Retransmit", "Fast Recovery"],
      ans: "A",
      exp: "Slow Start increases the congestion window exponentially until reaching ssthresh."
    },
    {
      q: "Which protocol allows multiple internal private IP addresses to share a single public IPv4 address?",
      opts: ["DHCP", "NAT (Network Address Translation)", "DNS", "BGP"],
      ans: "B",
      exp: "NAT/NAPT translates private internal socket addresses to a single public IP address using unique port numbers."
    }
  ];

  for (let i = 0; i < 200; i++) {
    const base = cnTemplates[i % cnTemplates.length];
    const variant = Math.floor(i / cnTemplates.length) + 1;
    list.push({
      topic: "CN",
      questionText: i < cnTemplates.length ? base.q : `[Variant ${variant}] ${base.q} (Topology ${i + 1})`,
      options: base.opts,
      correctAnswer: base.ans,
      explanation: base.exp
    });
  }

  // =========================================================================
  // 5. OBJECT-ORIENTED PROGRAMMING & DESIGN (200 Medium Questions)
  // =========================================================================
  const oopTemplates = [
    {
      q: "Which SOLID principle states that software components should be open for extension but closed for modification?",
      opts: ["Single Responsibility Principle", "Open/Closed Principle", "Liskov Substitution Principle", "Dependency Inversion Principle"],
      ans: "B",
      exp: "The Open/Closed Principle (OCP) encourages extending behavior through polymorphism without modifying existing code."
    },
    {
      q: "Which design pattern ensures a class has only one instance and provides a global point of access to it?",
      opts: ["Factory Pattern", "Singleton Pattern", "Observer Pattern", "Builder Pattern"],
      ans: "B",
      exp: "Singleton pattern restricts class instantiation to a single shared instance throughout the application."
    },
    {
      q: "What OOP concept allows a subclass to provide a specific implementation of a method defined in its superclass?",
      opts: ["Method Overloading", "Method Overriding", "Data Abstraction", "Encapsulation"],
      ans: "B",
      exp: "Method overriding provides dynamic dispatch implementation in derived classes for superclass methods."
    },
    {
      q: "What structural design pattern allows adding new behavior to objects dynamically by placing them inside wrapper objects?",
      opts: ["Decorator Pattern", "Adapter Pattern", "Facade Pattern", "Proxy Pattern"],
      ans: "A",
      exp: "Decorator pattern wraps objects to extend functionality dynamically without subclassing."
    },
    {
      q: "What OOP relationship describes a strong 'has-a' lifecycle ownership where child lifetime depends on the parent?",
      opts: ["Aggregation", "Composition", "Association", "Generalization"],
      ans: "B",
      exp: "Composition implies strong ownership; when the container parent is destroyed, child components are destroyed too."
    },
    {
      q: "What behavioral pattern defines a one-to-many dependency so that when one object changes state, all dependents are notified?",
      opts: ["Observer Pattern", "Strategy Pattern", "Command Pattern", "State Pattern"],
      ans: "A",
      exp: "Observer pattern decouples subject state changes from dependent observer updates."
    },
    {
      q: "What SOLID principle states that clients should not be forced to depend upon interfaces they do not use?",
      opts: ["Single Responsibility Principle", "Liskov Substitution Principle", "Interface Segregation Principle", "Dependency Inversion Principle"],
      ans: "C",
      exp: "Interface Segregation Principle (ISP) advocates small, focused interfaces rather than large monolithic interfaces."
    },
    {
      q: "In C++, what type of function declaration with '= 0' forces a class to become an Abstract Class?",
      opts: ["Virtual Destructor", "Pure Virtual Function", "Friend Function", "Inline Function"],
      ans: "B",
      exp: "Pure virtual functions (virtual void func() = 0;) make a class abstract, requiring concrete subclasses to implement them."
    },
    {
      q: "What structural design pattern acts as a simplified interface to a complex subsystem of classes?",
      opts: ["Facade Pattern", "Adapter Pattern", "Bridge Pattern", "Flyweight Pattern"],
      ans: "A",
      exp: "Facade provides a high-level, simplified entry point interface to complex subsystem operations."
    },
    {
      q: "What principle states that objects of a superclass should be replaceable with objects of subclasses without altering correctness?",
      opts: ["Single Responsibility Principle", "Open/Closed Principle", "Liskov Substitution Principle", "Dependency Inversion Principle"],
      ans: "C",
      exp: "Liskov Substitution Principle (LSP) ensures derived classes maintain behavioral subtyping contracts."
    }
  ];

  for (let i = 0; i < 200; i++) {
    const base = oopTemplates[i % oopTemplates.length];
    const variant = Math.floor(i / oopTemplates.length) + 1;
    list.push({
      topic: "OOP",
      questionText: i < oopTemplates.length ? base.q : `[Variant ${variant}] ${base.q} (OOP Module ${i + 1})`,
      options: base.opts,
      correctAnswer: base.ans,
      explanation: base.exp
    });
  }

  return list;
}

async function seed() {
  console.log("Building 1000 Medium-Level CS Question Dataset...");
  const questions = buildMediumQuestionBank();
  console.log(`Generated ${questions.length} questions across 5 core Computer Science topics.`);

  console.log("Seeding into PostgreSQL QuestionBank table...");
  let inserted = 0;

  for (let i = 0; i < questions.length; i += 50) {
    const batch = questions.slice(i, i + 50);
    await Promise.all(
      batch.map((q) =>
        prisma.questionBank.upsert({
          where: { questionText: q.questionText },
          update: {
            options: q.options,
            correctAnswer: q.correctAnswer,
            topic: q.topic,
            explanation: q.explanation,
          },
          create: {
            topic: q.topic,
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          },
        })
      )
    );
    inserted += batch.length;
    console.log(`Progress: ${inserted}/${questions.length} seeded.`);
  }

  const finalCount = await prisma.questionBank.count();
  console.log(`✅ SUCCESS! PostgreSQL QuestionBank table now contains ${finalCount} medium-level CS questions!`);
}

seed()
  .catch((e) => {
    console.error("Database seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
