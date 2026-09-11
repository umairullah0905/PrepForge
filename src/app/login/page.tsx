import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { Terminal, ArrowLeft } from "lucide-react";

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="qx-root flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 group-hover:border-zinc-700 transition-colors">
              <Terminal className="h-4 w-4 text-zinc-300" />
            </div>
            <span className="font-semibold text-base tracking-tight text-zinc-100">
              PREPFORGE
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Welcome to PrepForge OS
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access your practice records and live verification
          </p>
        </div>

        {/* Form container */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm shadow-xl">
          <AuthForm message={searchParams?.message} />
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Problem Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}