"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * OAuth callback: Supabase redirects here after Google sign-in (with ?code= for PKCE).
 * We exchange the code for a session, then redirect to home.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(() => {
          router.replace(next);
          router.refresh();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Sign-in failed");
        });
      return;
    }

    // Hash-based redirect (older flow): session may already be in URL hash; getSession parses it
    supabase.auth
      .getSession()
      .then(() => {
        router.replace(next);
        router.refresh();
      })
      .catch(() => {
        setError("Invalid callback");
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <a href="/auth" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-slate-600">Signing you in…</p>
    </div>
  );
}
