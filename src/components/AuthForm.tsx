"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function AuthForm({ message }: { message?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <>
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1 mb-6">
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "login"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "signup"
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      <form className="flex flex-col gap-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
              placeholder="e.g. Linus Torvalds"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
            placeholder="developer@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{message}</span>
          </div>
        )}

        <button
          formAction={mode === "signup" ? signup : login}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-zinc-100 text-xs font-medium text-zinc-950 hover:bg-white transition-colors"
        >
          <span>{mode === "signup" ? "Create Developer Account" : "Sign In to Workspace"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </>
  );
}
