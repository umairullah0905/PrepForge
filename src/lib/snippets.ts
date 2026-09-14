import { cache } from "react";

export interface CodeSnippetsMap {
  [language: string]: string;
}

export const getLeetCodeSnippets = cache(
  async function getLeetCodeSnippets(urlOrSlug: string): Promise<CodeSnippetsMap> {
    try {
      let slug = "";
      if (urlOrSlug.includes("/problems/")) {
        const match = urlOrSlug.match(/problems\/([^\/]+)/);
        slug = match ? match[1] : "";
      } else {
        slug = urlOrSlug.trim();
      }

      if (!slug) return {};

      const query = {
        query: `query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            codeSnippets {
              lang
              langSlug
              code
            }
          }
        }`,
        variables: { titleSlug: slug },
      };

      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (!res.ok) return {};

      const data = await res.json();
      const snippets = data.data?.question?.codeSnippets || [];
      const map: CodeSnippetsMap = {};

      for (const s of snippets) {
        if (s.langSlug === "python3" || s.langSlug === "python") {
          map["python"] = s.code;
        } else if (s.langSlug === "javascript") {
          map["javascript"] = s.code;
        } else if (s.langSlug === "typescript") {
          map["typescript"] = s.code;
        } else if (s.langSlug === "cpp") {
          map["cpp"] = s.code;
        } else if (s.langSlug === "java") {
          map["java"] = s.code;
        }
      }

      return map;
    } catch (err) {
      console.error("Error fetching LeetCode code snippets:", err);
      return {};
    }
  }
);
