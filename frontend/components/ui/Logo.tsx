import { Bone } from "lucide-react";

type LogoProps = { light?: boolean; centered?: boolean; compact?: boolean };

export function Logo({ light = false, centered = false, compact = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${centered ? "justify-center" : ""}`} aria-label="BoneVision AI">
      <span className={`grid place-items-center rounded-xl bg-teal-500 text-white ${compact ? "h-9 w-9" : "h-11 w-11"}`}>
        <Bone size={compact ? 20 : 24} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className={`font-semibold tracking-tight ${compact ? "text-[18px]" : "text-[21px]"} ${light ? "text-white" : "text-navy-900"}`}>
        BoneVision <span className="text-teal-500">AI</span>
      </span>
    </div>
  );
}
