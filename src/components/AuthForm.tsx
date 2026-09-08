"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";

export default function AuthForm({ message }: { message?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <>
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
        >
          LOG IN
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === "signup" ? "active" : ""}`}
          onClick={() => setMode("signup")}
        >
          SIGN UP
        </button>
      </div>

      <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="qx-field-label">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="qx-input"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="qx-field-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="qx-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="qx-field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="qx-input"
            placeholder="••••••••"
          />
        </div>

        {message && (
          <p
            className="qx-mono"
            style={{
              background: "rgba(255,107,107,0.12)",
              border: "2px solid var(--coral)",
              color: "var(--coral)",
              padding: "12px",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <button
          formAction={mode === "signup" ? signup : login}
          className="qx-btn"
          style={{ width: "100%", textAlign: "center", marginTop: 8 }}
        >
          {mode === "signup" ? "CREATE ACCOUNT" : "LOG IN"}
        </button>
      </form>
    </>
  );
}
