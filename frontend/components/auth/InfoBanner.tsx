import { ShieldCheck } from "lucide-react";

export function InfoBanner({ children = "Access is assigned by your administrator." }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[#F3F6F9] px-3.5 py-3 text-xs leading-5 text-[#68788D]">
      <ShieldCheck className="shrink-0 text-[#52728F]" size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
