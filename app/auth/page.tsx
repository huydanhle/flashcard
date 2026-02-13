"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.62l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setMessage(null);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
      setMessage({
        type: "error",
        text: "Supabase is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project.",
      });
      return;
    }
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (error) throw error;
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Google sign-in failed.",
      });
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-bg flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-[var(--shadow-lg)] dark:border-slate-600">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
            {isSignUp ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isSignUp
              ? "Sign up to save your flashcards and sync across devices."
              : "Sign in to access your flashcards."}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 font-semibold text-slate-700 shadow-[var(--shadow)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
            >
              <GoogleIcon className="h-5 w-5" />
              {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[var(--card)] px-3 text-slate-500 dark:text-slate-400">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
              />
            </div>
            {message && (
              <p
                className={`text-sm font-medium ${message.type === "error" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                role="alert"
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 disabled:opacity-60 dark:bg-indigo-500 dark:focus:ring-offset-slate-900"
            >
              {isLoading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="font-semibold text-[var(--accent)] hover:underline dark:text-indigo-400"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
