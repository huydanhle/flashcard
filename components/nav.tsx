"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";
import { supabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

function NavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[var(--accent)]/10 text-[var(--accent)] dark:bg-indigo-500/15 dark:text-indigo-400"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const navClass =
    "sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/90";

  if (isLoading) {
    return (
      <nav className={navClass}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Flashcards
          </Link>
          <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
        </div>
      </nav>
    );
  }

  if (!isAuthenticated) {
    return (
      <nav className={navClass}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Flashcards
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-indigo-500 dark:hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={navClass}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100"
        >
          Flashcards
        </Link>
        <div className="flex items-center gap-1">
          <NavLink href="/" isActive={pathname === "/"}>
            Cards
          </NavLink>
          <NavLink href="/quiz" isActive={pathname === "/quiz"}>
            Quiz
          </NavLink>
          <NavLink href="/dashboard" isActive={pathname === "/dashboard"}>
            Dashboard
          </NavLink>
          <div className="ml-2 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <ThemeToggle />
          <span className="ml-2 max-w-[140px] truncate text-xs text-slate-500 dark:text-slate-400" title={user?.email ?? undefined}>
            {user?.email ?? "User"}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
