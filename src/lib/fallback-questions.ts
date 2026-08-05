export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  topic?: string;
}

export const FALLBACK_QUESTION_BANK: MCQQuestion[] = [
  // ==========================================
  // --- Data Structures & Algorithms (DSA) ---
  // ==========================================
  {
    question: "What is the worst-case time complexity of QuickSort when using a naive pivot selection?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "Which data structure is primarily used to implement Breadth-First Search (BFS) on a graph?",
    options: ["Stack", "Queue", "Priority Queue", "Binary Search Tree"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the amortized time complexity of inserting an element into a dynamic array (like std::vector)?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
    correctAnswer: "C",
    topic: "DSA",
  },
  {
    question: "In a Min-Heap with N elements, what is the time complexity to find the minimum element?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctAnswer: "A",
    topic: "DSA",
  },
  {
    question: "Which algorithm is used to find the shortest path from a single source to all other vertices in a weighted graph with non-negative edge weights?",
    options: ["Prim's Algorithm", "Dijkstra's Algorithm", "Kruskal's Algorithm", "Floyd-Warshall Algorithm"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the tightest upper bound for searching an item in a balanced AVL Tree with n nodes?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "Which data structure is most suitable for evaluating a Postfix (Reverse Polish Notation) mathematical expression?",
    options: ["Queue", "Stack", "Linked List", "Hash Table"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the minimum number of binary comparisons required to sort 3 distinct elements in the worst case?",
    options: ["2", "3", "4", "5"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "In a Red-Black Tree, what is the maximum ratio of the length of the longest path from the root to a leaf versus the shortest path?",
    options: ["1.5", "2", "3", "Logarithmic"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What traversal of a Binary Search Tree (BST) visits nodes in strictly ascending order?",
    options: ["Pre-order", "In-order", "Post-order", "Level-order"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the worst-case space complexity of Depth-First Search (DFS) on a graph with depth D?",
    options: ["O(1)", "O(V + E)", "O(D)", "O(V²)"],
    correctAnswer: "C",
    topic: "DSA",
  },
  {
    question: "Which pattern matching algorithm utilizes a Failure Function (Prefix Table) to achieve O(N + M) time complexity?",
    options: ["Rabin-Karp", "Knuth-Morris-Pratt (KMP)", "Boyer-Moore", "Naive Matching"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the tightest worst-case time complexity of MergeSort on an array of length N?",
    options: ["O(N log N)", "O(N²)", "O(N)", "O(log N)"],
    correctAnswer: "A",
    topic: "DSA",
  },
  {
    question: "Which Minimum Spanning Tree algorithm operates by greedily adding the smallest weight edge that does not form a cycle?",
    options: ["Dijkstra's", "Prim's", "Kruskal's", "Bellman-Ford"],
    correctAnswer: "C",
    topic: "DSA",
  },
  {
    question: "What collision resolution technique in hash tables probes consecutive memory slots linearly?",
    options: ["Chaining", "Linear Probing", "Double Hashing", "Quadratic Probing"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the main advantage of a Trie (Prefix Tree) over a Hash Map for dictionary lookups?",
    options: ["Requires less memory", "Supports fast prefix-matching and autocomplete queries", "Has O(1) worst-case search", "Automatically sorts keys by frequency"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "In Dynamic Programming, what property must a problem possess to be solved using Memoization or Tabulation?",
    options: ["Greedy Choice Property & Optimal Substructure", "Overlapping Subproblems & Optimal Substructure", "Divide and Conquer & Linear Subproblems", "NP-Completeness"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the time complexity of building a Binary Heap from an unordered array of N elements (Heapify)?",
    options: ["O(N log N)", "O(N)", "O(N²)", "O(log N)"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "Which graph algorithm can detect negative-weight cycles in a directed weighted graph?",
    options: ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall Algorithm", "Kruskal's Algorithm"],
    correctAnswer: "B",
    topic: "DSA",
  },
  {
    question: "What is the auxiliary space complexity of a standard recursive implementation of Merge Sort on an array of size N?",
    options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
    correctAnswer: "C",
    topic: "DSA",
  },

  // ==========================================
  // --- Operating Systems (OS) ---------------
  // ==========================================
  {
    question: "Which CPU scheduling algorithm can lead to the 'Convoy Effect'?",
    options: ["Round Robin", "First-Come, First-Served (FCFS)", "Shortest Remaining Time First", "Priority Scheduling"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What condition is NOT required for a deadlock to occur (Coffman conditions)?",
    options: ["Mutual Exclusion", "Hold and Wait", "Preemption Allowed", "Circular Wait"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What occurs when the OS spends more time swapping pages in and out of main memory than executing processes?",
    options: ["Paging", "Fragmentation", "Thrashing", "Segmentation Fault"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What is the main advantage of a Translation Lookaside Buffer (TLB) in virtual memory systems?",
    options: ["Increases RAM capacity", "Speeds up virtual-to-physical address translation", "Eliminates page faults", "Replaces secondary storage"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "In UNIX systems, what system call creates a duplicate child process of the caller process?",
    options: ["exec()", "fork()", "spawn()", "clone()"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What mechanism is used by an OS kernel to handle asynchronous hardware events from devices?",
    options: ["Polling", "Interrupt Handling", "System Calls", "Context Switching"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "Which page replacement algorithm suffers from Belady's Anomaly?",
    options: ["Optimal (OPT)", "Least Recently Used (LRU)", "First-In, First-Out (FIFO)", "Second Chance Algorithm"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What state does a process enter if it has terminated execution but its parent process has not yet read its exit status?",
    options: ["Blocked", "Zombie", "Orphan", "Suspended"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What type of memory fragmentation occurs when total memory space is enough to satisfy a request, but it is not contiguous?",
    options: ["Internal Fragmentation", "External Fragmentation", "Page Faulting", "Segment Overlap"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "Which synchronization primitive prevents race conditions by using atomic test-and-set operations?",
    options: ["Pipe", "Mutex Semaphore", "Condition Variable", "Shared Memory"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What algorithm is used by Operating Systems for Deadlock Avoidance by analyzing resource allocation states?",
    options: ["Peterson's Algorithm", "Banker's Algorithm", "Snooping Algorithm", "Bakery Algorithm"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What is a major advantage of Inverted Page Tables over traditional Multi-level Page Tables?",
    options: ["Reduces memory overhead by using one entry per physical frame", "Speeds up page fault recovery", "Allows shared virtual address spaces", "Eliminates TLB misses"],
    correctAnswer: "A",
    topic: "OS",
  },
  {
    question: "In thread management, what is a key difference between User-Level Threads (ULT) and Kernel-Level Threads (KLT)?",
    options: ["ULT requires hardware support", "KLT context switches are faster than ULT", "Kernel is unaware of ULTs so a blocking call blocks the entire process", "ULT allows multi-core execution while KLT does not"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What RAID level provides block-level striping with distributed parity across all drives?",
    options: ["RAID 0", "RAID 1", "RAID 5", "RAID 10"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What is the primary role of the OS Scheduler's Dispatcher module?",
    options: ["Selecting the next process from ready queue", "Transferring CPU control to the process selected by short-term scheduler", "Allocating RAM memory pages", "Handling system interrupts"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "Which disk scheduling algorithm selects the request with the minimum seek time from the current head position?",
    options: ["FCFS", "SSTF (Shortest Seek Time First)", "SCAN (Elevator)", "C-LOOK"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "What condition defines a critical section problem solution's Bounded Waiting property?",
    options: ["Only one process can execute in critical section", "No process outside critical section can block other processes", "There is a limit on the number of times other processes can enter critical section after a request is made", "Processes must enter in FIFO order"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What is the main function of an inode in UNIX file systems?",
    options: ["Stores the filename and directory path", "Stores file metadata and data block pointers", "Stores user login passwords", "Manages network socket connections"],
    correctAnswer: "B",
    topic: "OS",
  },
  {
    question: "In CPU scheduling, what is turnaround time?",
    options: ["Time spent in ready queue", "Time spent executing on CPU", "Total interval from process submission to process completion", "Time taken to produce first response"],
    correctAnswer: "C",
    topic: "OS",
  },
  {
    question: "What hardware component handles dual-mode execution (User Mode vs Kernel Mode) in modern CPUs?",
    options: ["Mode Bit in CPU Control Register", "ALU Status Register", "Cache Controller", "DMA Controller"],
    correctAnswer: "A",
    topic: "OS",
  },

  // ==========================================
  // --- Database Management Systems (DBMS) ---
  // ==========================================
  {
    question: "Which ACID property ensures that all operations in a database transaction complete successfully or none are applied?",
    options: ["Atomicity", "Consistency", "Isolation", "Durability"],
    correctAnswer: "A",
    topic: "DBMS",
  },
  {
    question: "In SQL, which clause is used to filter records resulting from an aggregate function like GROUP BY?",
    options: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What normal form requires a table to be in 1NF and have no partial dependencies on a composite primary key?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "Which index structure is most widely used in relational databases for efficient range queries and sequential scans?",
    options: ["Hash Index", "B+ Tree", "Binary Search Tree", "Inverted Index"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What relational algebra operator returns rows present in the first relation but absent in the second relation?",
    options: ["Selection (σ)", "Projection (π)", "Difference (-)", "Cartesian Product (×)"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "Which isolation level prevents Dirty Reads but still allows Non-Repeatable Reads?",
    options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What mechanism does Write-Ahead Logging (WAL) support in relational database recovery?",
    options: ["Data Compression", "Durability & Atomicity", "Automatic Query Tuning", "Schema Migration"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "Which SQL JOIN returns all rows from the left table and matched rows from the right table, filling non-matches with NULL?",
    options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What concept in DBMS describes a situation where transaction T1 reads data modified by transaction T2 before T2 commits?",
    options: ["Phantom Read", "Dirty Read", "Lost Update", "Non-Repeatable Read"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "A relation is in BCNF if for every functional dependency X -> Y, what condition must hold for X?",
    options: ["X is a candidate key / super key", "Y is a prime attribute", "X is a foreign key", "Y is single-valued"],
    correctAnswer: "A",
    topic: "DBMS",
  },
  {
    question: "What concurrency control technique uses Shared (S) and Exclusive (X) locks with Growing and Shrinking phases?",
    options: ["Timestamp Ordering", "Two-Phase Locking (2PL)", "Multiversion Concurrency Control (MVCC)", "Optimistic Concurrency Control"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What phenomenon occurs when transaction T1 executes a query based on a predicate, and T2 inserts new rows matching that predicate before T1 commits?",
    options: ["Dirty Read", "Non-Repeatable Read", "Phantom Read", "Uncommitted Update"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "What is the primary operational difference between a B-Tree and a B+ Tree index?",
    options: ["B-Trees store data pointers only in leaf nodes", "B+ Trees store data pointers only in leaf nodes, forming a linked leaf list", "B+ Trees are strictly binary trees", "B-Trees do not support range searches"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "Which SQL constraint ensures that all values in a column are unique and non-null by default?",
    options: ["UNIQUE", "FOREIGN KEY", "PRIMARY KEY", "CHECK"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "What normal form eliminates transitive dependencies of non-prime attributes on candidate keys?",
    options: ["1NF", "2NF", "3NF", "4NF"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "In database crash recovery, what rule requires log records to be written to stable storage before corresponding data pages are written to disk?",
    options: ["Steal Policy", "No-Force Policy", "Write-Ahead Logging (WAL) Rule", "Shadow Paging Rule"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "Which SQL statement is classified as Data Definition Language (DDL)?",
    options: ["SELECT", "INSERT", "ALTER", "UPDATE"],
    correctAnswer: "C",
    topic: "DBMS",
  },
  {
    question: "What type of database view is physically computed and stored on disk for high performance queries?",
    options: ["Virtual View", "Materialized View", "Dynamic View", "Inline View"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "In NoSQL terminology, what database type is MongoDB classified as?",
    options: ["Key-Value Store", "Document Store", "Column-Family Store", "Graph Database"],
    correctAnswer: "B",
    topic: "DBMS",
  },
  {
    question: "What does the CAP theorem state regarding distributed data systems during a network partition?",
    options: ["System can guarantee Consistency and Availability simultaneously", "System must choose between Consistency and Availability", "System loses Partition Tolerance", "System cannot guarantee Durability"],
    correctAnswer: "B",
    topic: "DBMS",
  },

  // ==========================================
  // --- Computer Networks (CN) ---------------
  // ==========================================
  {
    question: "Which layer of the OSI model is responsible for end-to-end packet delivery and logical addressing (IP addresses)?",
    options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What is the primary difference between TCP and UDP protocols?",
    options: [
      "TCP is connection-oriented and reliable, while UDP is connectionless and unverified",
      "UDP guarantees packet order while TCP does not",
      "TCP operates at the Network layer while UDP operates at Application layer",
      "UDP is used exclusively for encrypted secure communication"
    ],
    correctAnswer: "A",
    topic: "CN",
  },
  {
    question: "Which protocol maps a known IPv4 address to its corresponding physical MAC address on a local network segment?",
    options: ["DNS", "ARP", "DHCP", "ICMP"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "In the TCP 3-way handshake, what is the exact sequence of flags sent to establish a connection?",
    options: ["SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "FIN, ACK, FIN-ACK", "RST, SYN, ACK"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What is the default port number for HTTPS (HTTP Secure) encrypted traffic?",
    options: ["80", "22", "443", "8080"],
    correctAnswer: "C",
    topic: "CN",
  },
  {
    question: "Which subnet mask corresponds to a CIDR notation of /24?",
    options: ["255.255.0.0", "255.255.255.0", "255.255.255.128", "255.255.240.0"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What mechanism in TCP prevents a fast sender from overwhelming a slow receiver's buffer capacity?",
    options: ["Congestion Control", "Flow Control (Sliding Window)", "Retransmission Timeout", "Packet Fragmentation"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "Which application layer protocol automatically assigns IP addresses, subnet masks, and default gateways to network hosts?",
    options: ["DNS", "SNMP", "DHCP", "FTP"],
    correctAnswer: "C",
    topic: "CN",
  },
  {
    question: "What ICMP command utility uses TTL (Time To Live) expiration messages to trace the path taken by packets across routers?",
    options: ["ping", "traceroute / tracert", "nslookup", "netstat"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "Which routing protocol uses the Dijkstra algorithm to build its link-state routing table?",
    options: ["RIP", "OSPF", "BGP", "EIGRP"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What length is a standard IPv6 network address in bits?",
    options: ["32 bits", "64 bits", "128 bits", "256 bits"],
    correctAnswer: "C",
    topic: "CN",
  },
  {
    question: "What algorithm is used by TCP for Congestion Control during initial connection startup?",
    options: ["Slow Start", "Fast Recovery", "Leaky Bucket", "Token Bucket"],
    correctAnswer: "A",
    topic: "CN",
  },
  {
    question: "Which protocol operates at the Application Layer to resolve human-readable domain names into IP addresses?",
    options: ["ARP", "DNS", "BGP", "NAT"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "In Data Link layer CSMA/CD protocols, what does a host do upon detecting a collision on a shared medium?",
    options: ["Retransmits immediately", "Sends a jam signal and executes binary exponential backoff", "Drops the frame permanently", "Switches to full-duplex mode"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What device operates at Layer 2 of the OSI model to forward frames based on destination MAC addresses?",
    options: ["Hub", "Switch", "Router", "Repeater"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "Which HTTP status code series represents a Successful Client Request response?",
    options: ["1xx", "2xx", "3xx", "4xx"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What protocol allows multiple private internal IP addresses to share a single public IP address when accessing the Internet?",
    options: ["DHCP", "NAT (Network Address Translation)", "DNS", "ICMP"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "Which transport protocol does DNS primary lookup default to for fast, small query resolution?",
    options: ["TCP", "UDP", "SCTP", "QUIC"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "What field in an IPv4 packet header prevents packets from looping infinitely in a network?",
    options: ["Header Checksum", "TTL (Time To Live)", "Fragment Offset", "Differentiating Services Code"],
    correctAnswer: "B",
    topic: "CN",
  },
  {
    question: "Which inter-domain routing protocol (Path Vector) is used to exchange routing information between Autonomous Systems (AS) on the Internet?",
    options: ["RIP", "OSPF", "BGP (Border Gateway Protocol)", "IS-IS"],
    correctAnswer: "C",
    topic: "CN",
  },

  // ==========================================
  // --- Object-Oriented Programming (OOP) ----
  // ==========================================
  {
    question: "Which OOP concept allows a subclass to provide a specific implementation of a method already defined in its superclass?",
    options: ["Method Overloading", "Method Overriding", "Data Abstraction", "Encapsulation"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What dynamic binding feature allows calling overridden methods through a base class reference at runtime?",
    options: ["Polymorphism", "Inheritance", "Encapsulation", "Compilation"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "Which design pattern ensures that a class has only one single instance throughout the application lifecycle?",
    options: ["Factory Pattern", "Singleton Pattern", "Observer Pattern", "Strategy Pattern"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What principle of SOLID states that software entities should be open for extension, but closed for modification?",
    options: ["Single Responsibility Principle", "Open/Closed Principle", "Liskov Substitution Principle", "Interface Segregation Principle"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "In C++, what type of member function must be declared with '= 0' to make a class abstract?",
    options: ["Virtual Destructor", "Pure Virtual Function", "Friend Function", "Inline Function"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What object-oriented design practice restricts direct access to internal state variables, requiring public getter/setter methods?",
    options: ["Abstraction", "Encapsulation", "Polymorphism", "Delegation"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What design pattern defines a 1-to-N dependency between objects so that when one object changes state, all dependents are notified?",
    options: ["Observer Pattern", "Decorator Pattern", "Adapter Pattern", "Singleton Pattern"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What relation best describes a 'has-a' relationship where child objects CAN exist independently of the container parent object?",
    options: ["Composition", "Aggregation", "Inheritance", "Generalization"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "Which keyword in Java prevents a class from being inherited or a method from being overridden?",
    options: ["static", "final", "abstract", "const"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What principle states that objects of a superclass should be replaceable with objects of its subclasses without breaking application logic?",
    options: ["Liskov Substitution Principle", "Dependency Inversion Principle", "Single Responsibility Principle", "Interface Segregation Principle"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "Which design pattern decouples an abstraction from its implementation so that the two can vary independently?",
    options: ["Adapter Pattern", "Bridge Pattern", "Composite Pattern", "Facade Pattern"],
    correctAnswer: "B",
    topic: "OOP",
  },
  {
    question: "What design pattern allows adding new functionality to an existing object dynamically without altering its structure?",
    options: ["Decorator Pattern", "Proxy Pattern", "Builder Pattern", "Prototype Pattern"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "In OOP, what is the key difference between an Interface and an Abstract Class in languages like Java/TypeScript?",
    options: ["Interfaces support multiple inheritance of type, whereas classes inherit from a single abstract class", "Abstract classes cannot contain any implementation code", "Interfaces can instantiate objects directly", "Abstract classes cannot have fields"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What SOLID principle advises depending upon abstractions rather than concrete implementations?",
    options: ["Single Responsibility Principle", "Open/Closed Principle", "Interface Segregation Principle", "Dependency Inversion Principle"],
    correctAnswer: "D",
    topic: "OOP",
  },
  {
    question: "Which Creational design pattern isolates the construction of a complex object from its representation?",
    options: ["Builder Pattern", "Factory Method", "Abstract Factory", "Singleton"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What is the Diamond Problem in object-oriented programming languages that support multiple inheritance?",
    options: ["Ambiguity when a class inherits from two classes that both inherit from a common base class", "Stack overflow caused by recursive constructor calls", "Memory leak in virtual tables", "Deadlock in thread synchronization"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "Which design pattern acts as a unified simplified interface to a set of interfaces in a complex subsystem?",
    options: ["Facade Pattern", "Adapter Pattern", "Flyweight Pattern", "Proxy Pattern"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What behavioral design pattern encapsulates a request as an object, enabling parameterization of clients with queues or operations?",
    options: ["Command Pattern", "Strategy Pattern", "State Pattern", "Visitor Pattern"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What relation describes a strong 'has-a' ownership where the child object's lifecycle is bound to the parent object?",
    options: ["Composition", "Aggregation", "Association", "Realization"],
    correctAnswer: "A",
    topic: "OOP",
  },
  {
    question: "What is method overloading (compile-time polymorphism)?",
    options: ["Defining multiple methods in the same class with the same name but different parameter signatures", "Redefining a superclass method in a subclass", "Invoking a method via virtual table dispatch", "Binding method calls at runtime based on object instance"],
    correctAnswer: "A",
    topic: "OOP",
  },
];

/**
 * Returns N randomly selected, non-repeating fallback questions from the pool.
 */
export function getRandomFallbackQuestions(
  count: number = 10,
  avoidQuestionTexts: string[] = []
): MCQQuestion[] {
  const normalizedAvoid = new Set(
    avoidQuestionTexts.map((text) => text.trim().toLowerCase())
  );

  const eligible = FALLBACK_QUESTION_BANK.filter(
    (q) => !normalizedAvoid.has(q.question.trim().toLowerCase())
  );

  const pool = eligible.length >= count ? eligible : [...FALLBACK_QUESTION_BANK];

  // Fisher-Yates shuffle
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
