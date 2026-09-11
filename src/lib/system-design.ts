import fs from "fs";
import path from "path";

export interface ChapterSummary {
  slug: string;
  title: string;
  chapterNumber: number;
  difficulty: string;
  scale: string;
  topics: string[];
  readTimeMinutes: string;
  byteByteGoUrl: string;
  category: "Fundamentals" | "Building Blocks" | "Services & Scale" | "Enterprise Systems";
}

export interface ChapterTocItem {
  level: number;
  id: string;
  text: string;
}

export interface ChapterDetail extends ChapterSummary {
  course: string;
  wordCount: number;
  toc: ChapterTocItem[];
  contentHtml: string;
}

const DATA_DIR = path.join(process.cwd(), "src", "data", "system-design");

function assignCategory(slug: string): ChapterSummary["category"] {
  if (
    slug === "scale-from-zero-to-millions-of-users" ||
    slug === "back-of-the-envelope-estimation" ||
    slug === "a-framework-for-system-design-interviews"
  ) {
    return "Fundamentals";
  }
  if (
    slug === "design-a-rate-limiter" ||
    slug === "design-consistent-hashing" ||
    slug === "design-a-key-value-store"
  ) {
    return "Building Blocks";
  }
  if (
    slug === "hotel-reservation-system" ||
    slug === "real-time-gaming-leaderboard"
  ) {
    return "Enterprise Systems";
  }
  return "Services & Scale";
}

export function getAllChapters(): ChapterSummary[] {
  try {
    const chaptersPath = path.join(DATA_DIR, "chapters.json");
    if (!fs.existsSync(chaptersPath)) return [];
    const raw = fs.readFileSync(chaptersPath, "utf-8");
    const list = JSON.parse(raw);
    return list.map((item: Omit<ChapterSummary, "category">) => ({
      ...item,
      category: assignCategory(item.slug),
    }));
  } catch (err) {
    console.error("Error reading system design chapters:", err);
    return [];
  }
}

export function getChapterBySlug(slug: string): ChapterDetail | null {
  try {
    const filePath = path.join(DATA_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return {
      ...data,
      category: assignCategory(slug),
    };
  } catch (err) {
    console.error(`Error reading system design chapter ${slug}:`, err);
    return null;
  }
}

export function getAdjacentChapters(currentSlug: string): {
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
} {
  const all = getAllChapters();
  const currentIndex = all.findIndex((c) => c.slug === currentSlug);
  if (currentIndex === -1) return { prev: null, next: null };

  return {
    prev: currentIndex > 0 ? all[currentIndex - 1] : null,
    next: currentIndex < all.length - 1 ? all[currentIndex + 1] : null,
  };
}
