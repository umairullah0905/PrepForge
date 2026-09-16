import katex from "katex";

function sanitizeTex(tex: string): string {
  return tex
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&le;/g, "\\le ")
    .replace(/&ge;/g, "\\ge ")
    .replace(/&nbsp;/g, " ")
    .replace(/&times;/g, "\\times ")
    .replace(/&minus;/g, "-")
    .trim();
}

/**
 * Parses Codeforces math delimiters ($$$...$$$ and $$$$...$$$$)
 * and renders them to HTML using KaTeX.
 */
export function renderMathInHtml(html: string): string {
  if (!html) return "";

  // 1. Display math: $$$$ ... $$$$
  let result = html.replace(/\$\$\$\$([\s\S]*?)\$\$\$\$/g, (match, tex) => {
    try {
      const cleanTex = sanitizeTex(tex);
      return katex.renderToString(cleanTex, { throwOnError: false, displayMode: true });
    } catch {
      return match;
    }
  });

  // 2. Inline math: $$$ ... $$$
  result = result.replace(/\$\$\$([\s\S]*?)\$\$\$/g, (match, tex) => {
    try {
      const cleanTex = sanitizeTex(tex);
      return katex.renderToString(cleanTex, { throwOnError: false, displayMode: false });
    } catch {
      return match;
    }
  });

  return result;
}
