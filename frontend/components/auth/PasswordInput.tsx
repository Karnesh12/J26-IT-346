"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import type { LoginValues } from "@/lib/validators";
import { Input } from "@/components/ui/Input";

type PasswordInputProps = {
  id: string;
  invalid?: boolean;
  describedBy?: string;
  register: UseFormRegister<LoginValues>;
};

export function PasswordInput({ id, invalid, describedBy, register }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`flex h-[50px] items-center rounded-lg border bg-white transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 ${invalid ? "border-red-400" : "border-border"}`}>
      <LockKeyhole size={17} className="ml-3.5 shrink-0 text-[#8190A4]" aria-hidden="true" />
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter your password"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="h-full border-0 pr-1 shadow-none focus:border-0 focus:ring-0"
        {...register("password")}
      />
      <button
        type="button"
        className="focus-ring mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#718198] hover:bg-slate-50 hover:text-navy-900"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
