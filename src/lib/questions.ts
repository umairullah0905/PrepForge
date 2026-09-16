import { cache } from "react";

export interface Question {
  id: string;
  title: string;
  difficulty: string;
  platform?: string;
  topics?: string[];
  url?: string;
  solution_link?: string;
  created_at?: string;
}

export interface CompanyQuestion {
  id: string;
  title: string;
  difficulty: string;
  company_names: string[];
  topics?: string;
  link?: string;
}

export const getCachedQuestions = cache(async function getCachedQuestions(): Promise<Question[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?select=id,title,difficulty,platform,topics,url,solution_link,created_at&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 60,
        tags: ["questions"],
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Question[];
    }
  } catch (err) {
    console.error("Error fetching cached questions via REST:", err);
  }
  return [];
});

export const getCachedCompanyQuestions = cache(async function getCachedCompanyQuestions(): Promise<CompanyQuestion[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/company_questions?select=id,title,difficulty,company_names,topics,link&order=title.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
      },
      next: {
        revalidate: 300,
        tags: ["company_questions"],
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as CompanyQuestion[];
    }
  } catch (err) {
    console.error("Error fetching cached company questions via REST:", err);
  }
  return [];
});

export function normalizeTopicName(rawTopic: string): string {
  if (!rawTopic) return "Uncategorized";
  const trimmed = rawTopic.trim();
  const lower = trimmed.toLowerCase();

  const TOPIC_CANONICAL_MAP: Record<string, string> = {
    array: "Arrays",
    arrays: "Arrays",
    string: "Strings",
    strings: "Strings",
    "binary search": "Binary Search",
    "two pointers": "Two Pointers",
    "two-pointers": "Two Pointers",
    "sliding window": "Sliding Window",
    stack: "Stack & Queue",
    stacks: "Stack & Queue",
    queue: "Stack & Queue",
    queues: "Stack & Queue",
    "stack & queue": "Stack & Queue",
    "linked list": "Linked List",
    "linked lists": "Linked List",
    tree: "Trees",
    trees: "Trees",
    "binary tree": "Trees",
    "binary search tree": "Trees",
    bst: "Trees",
    trie: "Trie",
    heap: "Heap / Priority Queue",
    "priority queue": "Heap / Priority Queue",
    "heap / priority queue": "Heap / Priority Queue",
    graph: "Graphs",
    graphs: "Graphs",
    "bipartite graphs": "Graphs",
    "breadth-first search": "Breadth-First Search",
    bfs: "Breadth-First Search",
    "depth-first search": "Depth-First Search",
    dfs: "Depth-First Search",
    "dfs and similar": "Depth-First Search",
    backtracking: "Backtracking",
    "dynamic programming": "Dynamic Programming",
    dp: "Dynamic Programming",
    greedy: "Greedy",
    "bit manipulation": "Bit Manipulation & Bitmasks",
    bitmask: "Bit Manipulation & Bitmasks",
    bitmasks: "Bit Manipulation & Bitmasks",
    "brute force": "Brute Force",
    math: "Math & Number Theory",
    maths: "Math & Number Theory",
    mathematics: "Math & Number Theory",
    "number theory": "Math & Number Theory",
    combinatorics: "Combinatorics",
    geometry: "Geometry",
    matrices: "Matrix",
    matrix: "Matrix",
    sorting: "Sorting",
    sortings: "Sorting",
    hashing: "Hash Table",
    "hash table": "Hash Table",
    dsu: "Disjoint Set Union (DSU)",
    "disjoint set": "Disjoint Set Union (DSU)",
    implementation: "Implementation",
    algorithms: "General Algorithms",
    codeforces: "Codeforces Archive",
    intervals: "Intervals",
    simulation: "Simulation",
  };

  if (TOPIC_CANONICAL_MAP[lower]) {
    return TOPIC_CANONICAL_MAP[lower];
  }

  // Convert kebab-case or underscore or lowercase to Title Case
  return trimmed
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
