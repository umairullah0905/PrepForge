import AuthForm from "@/components/AuthForm";

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div
      className="qx-root"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div
        className="qx-dash-card"
        style={{ maxWidth: 420, width: "100%", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="qx-pixel qx-eyebrow">🔑 CONTINUE</span>
          <h2 className="qx-pixel" style={{ fontSize: 18, marginTop: 20, lineHeight: 1.6 }}>
            Prep Forge
          </h2>
          <p className="qx-sub" style={{ fontSize: 14, marginTop: 12 }}>
            Sign in to access your AI DSA mentor
          </p>
        </div>

        <AuthForm message={searchParams?.message} />
      </div>
    </div>
  );
}