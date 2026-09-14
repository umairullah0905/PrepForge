"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Monaco Editor to avoid SSR issues in Next.js
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e] text-zinc-500">
      <div className="flex items-center gap-2 text-sm font-mono">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        <span>Initializing Editor...</span>
      </div>
    </div>
  ),
});

interface CodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const MONACO_LANG_MAP: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  cpp: "cpp",
  java: "java",
};

export default function CodeEditor({
  language,
  code,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const monacoLang = MONACO_LANG_MAP[language.toLowerCase()] || "plaintext";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        language={monacoLang}
        value={code}
        theme="vs-dark"
        onChange={(val) => onChange(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          fontFamily: "var(--font-mono), 'Fira Code', monospace",
          padding: { top: 12, bottom: 12 },
          lineHeight: 22,
          tabSize: 4,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
