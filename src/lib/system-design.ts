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

function getLocalChapters(): ChapterSummary[] {
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
    console.error("Error reading local system design chapters:", err);
    return [];
  }
}

function getLocalChapterBySlug(slug: string): ChapterDetail | null {
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
    console.error(`Error reading local system design chapter ${slug}:`, err);
    return null;
  }
}

export async function getAllChapters(): Promise<ChapterSummary[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const url = `${supabaseUrl}/rest/v1/system_design_chapters?select=slug,title,chapter_number,difficulty,scale,topics,read_time_minutes,bytebytego_url,category&order=chapter_number.asc`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: {
          revalidate: 60,
          tags: ["system-design-chapters"],
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            slug: r.slug,
            title: r.title,
            chapterNumber: r.chapter_number,
            difficulty: r.difficulty,
            scale: r.scale || "",
            topics: r.topics || [],
            readTimeMinutes: r.read_time_minutes || "",
            byteByteGoUrl: r.bytebytego_url || "",
            category: (r.category as ChapterSummary["category"]) || assignCategory(r.slug),
          }));
        }
      }
    } catch (err) {
      console.error("Error querying system_design_chapters from Supabase:", err);
    }
  }

  // Fallback to local JSON files
  return getLocalChapters();
}

export async function getChapterBySlug(slug: string): Promise<ChapterDetail | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const url = `${supabaseUrl}/rest/v1/system_design_chapters?slug=eq.${slug}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: {
          revalidate: 60,
          tags: [`sd-chapter-${slug}`],
        },
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          return {
            slug: r.slug,
            title: r.title,
            chapterNumber: r.chapter_number,
            difficulty: r.difficulty || "Intermediate",
            scale: r.scale || "",
            topics: r.topics || [],
            readTimeMinutes: r.read_time_minutes || "",
            byteByteGoUrl: r.bytebytego_url || "",
            category: (r.category as ChapterSummary["category"]) || assignCategory(r.slug),
            course: "System Design Interview",
            wordCount: (r.content_html || "").split(/\s+/).length,
            toc: r.toc || [],
            contentHtml: r.content_html || "",
          };
        }
      }
    } catch (err) {
      console.error(`Error querying system_design_chapter ${slug} from Supabase:`, err);
    }
  }

  // Fallback to local file
  return getLocalChapterBySlug(slug);
}

export async function getAdjacentChapters(currentSlug: string): Promise<{
  prev: ChapterSummary | null;
  next: ChapterSummary | null;
}> {
  const all = await getAllChapters();
  const currentIndex = all.findIndex((c) => c.slug === currentSlug);
  if (currentIndex === -1) return { prev: null, next: null };

  return {
    prev: currentIndex > 0 ? all[currentIndex - 1] : null,
    next: currentIndex < all.length - 1 ? all[currentIndex + 1] : null,
  };
}
