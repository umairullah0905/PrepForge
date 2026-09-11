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
