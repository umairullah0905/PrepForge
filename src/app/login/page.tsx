import { login, signup } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="qx-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
      <div
        className="qx-dash-card"
        style={{ maxWidth: 420, width: "100%", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="qx-pixel qx-eyebrow">🔑 CONTINUE</span>
          <h2 className="qx-pixel" style={{ fontSize: 18, marginTop: 20, lineHeight: 1.6 }}>
            PrepForge
          </h2>
          <p className="qx-sub" style={{ fontSize: 14, marginTop: 12 }}>
            Sign in to access your AI DSA mentor
          </p>
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

          {searchParams?.message && (
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
              {searchParams.message}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <button formAction={login} className="qx-btn" style={{ width: "100%", textAlign: "center" }}>
              LOG IN
            </button>
            <button
              formAction={signup}
              className="qx-btn qx-btn-ghost"
              style={{ width: "100%", textAlign: "center" }}
            >
              SIGN UP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
