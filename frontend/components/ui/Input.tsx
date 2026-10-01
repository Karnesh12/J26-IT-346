import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid = false, className = "", ...props }: InputProps) {
  return (
    <input
      className={`focus-ring h-[50px] w-full rounded-lg border bg-white px-3.5 text-sm text-text-dark placeholder:text-[#8C98A9] transition ${
        invalid ? "border-red-400 focus:border-red-500" : "border-border focus:border-teal-500"
      } ${className}`}
      {...props}
    />
  );
}
