"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type CurrentUser = { name: string; email: string; role: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        let response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401) {
          const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
          if (!refreshed.ok) {
            router.replace("/login");
            return;
          }
          response = await fetch("/api/auth/me", { cache: "no-store" });
        }
        const body = await response.json() as { success: boolean; data: CurrentUser | null; message: string };
        if (!response.ok || !body.success || !body.data) {
          router.replace("/login");
          return;
        }
        if (active) setUser(body.data);
      } catch {
        if (active) setError("Unable to load your workspace. Check your connection and try again.");
      }
    };
    void loadUser();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-bg-soft">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4 sm:px-10">
        <Logo compact />
        <form action="/api/auth/logout" method="post"><button className="focus-ring rounded px-3 py-2 text-sm font-semibold text-muted hover:text-navy-900">Sign out</button></form>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs font-semibold tracking-[0.16em] text-teal-600">RESEARCH WORKSPACE</p>
        {user ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-navy-900">Welcome, {user.name || user.email}</h1>
            <p className="mt-2 text-sm text-muted">Your BoneVision AI research workspace is ready.</p>
            <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
              <p className="text-sm text-[#4C5D72]">This is a protected placeholder for the research dashboard.</p>
              <Link href="/login" className="mt-4 inline-flex text-sm font-medium text-link-blue underline">Research use only — not for clinical use</Link>
            </div>
          </>
        ) : error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
        ) : (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin" size={16} aria-hidden="true" />Loading your workspace...</p>
        )}
      </section>
    </main>
  );
}
