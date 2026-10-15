import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const shared = "focus-ring inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const style = variant === "primary"
    ? "bg-teal-500 text-white shadow-[0_5px_14px_rgba(14,154,160,0.18)] hover:bg-teal-600"
    : "border border-[#B8C9DF] bg-white text-[#124378] hover:bg-[#F5F9FD]";

  return <button className={`${shared} ${style} ${className}`} {...props}>{children}</button>;
}
