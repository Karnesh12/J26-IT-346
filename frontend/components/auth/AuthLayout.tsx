import type { ReactNode } from "react";
import { HeroPanel } from "./HeroPanel";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-grid min-h-screen">
      <HeroPanel />
      <section className="relative flex min-h-[720px] flex-col items-center justify-center bg-bg-soft px-5 pb-6 pt-16 sm:px-8 lg:min-h-screen lg:px-12 lg:py-[72px]">
        <div className="absolute right-6 top-6 flex items-center gap-3 text-[9px] font-semibold tracking-[0.13em] text-[#8290A2] sm:right-9 sm:top-8">
          <span>RESEARCH USE ONLY</span><span className="h-px w-7 bg-[#C8D1DC]" /><span>NOT FOR CLINICAL USE</span>
        </div>
        {children}
        <footer className="mt-7 text-center text-[10px] text-[#8B97A7]">
          Research use only <span className="px-1.5 text-[#B7C0CB]">|</span> © {new Date().getFullYear()} BoneVision AI <span className="px-1.5 text-[#B7C0CB]">|</span> All rights reserved.
        </footer>
      </section>
    </main>
  );
}
