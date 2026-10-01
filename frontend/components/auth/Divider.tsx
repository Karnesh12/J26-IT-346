export function Divider({ label = "OR" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <span className="h-px flex-1 bg-[#E5EAF0]" />
      <span className="text-[11px] font-semibold tracking-[0.16em] text-[#9AA5B3]">{label}</span>
      <span className="h-px flex-1 bg-[#E5EAF0]" />
    </div>
  );
}
