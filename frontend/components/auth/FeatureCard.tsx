import type { LucideIcon } from "lucide-react";

type FeatureCardProps = { icon: LucideIcon; title: string; description: string };

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="min-h-[106px] rounded-xl border border-white/[0.12] bg-white/[0.055] px-4 py-3.5 backdrop-blur-sm">
      <Icon className="mb-2.5 text-[#49D2D0]" size={20} strokeWidth={1.8} aria-hidden="true" />
      <h3 className="text-[13px] font-semibold text-white">{title}</h3>
      <p className="mt-1 text-[11px] leading-[1.55] text-[#A8BCD0]">{description}</p>
    </div>
  );
}
