"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InfoBanner } from "@/components/auth/InfoBanner";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { apiRequest, ApiError } from "@/lib/api";
import { otpSchema } from "@/lib/validators";

type VerifyValues = { code: string };

export default function VerifyPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyValues>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    const savedCode = sessionStorage.getItem("bonevision_dev_otp");
    if (savedCode) setDevelopmentCode(savedCode);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async ({ code }: VerifyValues) => {
    setServerError("");
    try {
      await apiRequest("/api/auth/verify-otp", { code });
      sessionStorage.removeItem("bonevision_dev_otp");
      router.push("/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Verification failed. Please try again.");
    }
  };

  const resendCode = async () => {
    setServerError("");
    try {
      const response = await apiRequest<{ development_otp?: string }>("/api/auth/resend-otp");
      const code = response.data?.development_otp;
      if (code) {
        setDevelopmentCode(code);
        sessionStorage.setItem("bonevision_dev_otp", code);
      }
      setMessage("A new verification code has been sent.");
      setCooldown(30);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Unable to resend the code.");
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[520px] rounded-2xl border border-[#E3E8EF] bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10" aria-labelledby="verify-title">
        <div className="mb-5"><Logo centered compact /></div>
        <h1 id="verify-title" className="text-center text-[23px] font-semibold tracking-[-0.025em] text-navy-900">Verify your email</h1>
        <p className="mt-1.5 text-center text-[13px] leading-5 text-muted">Enter the 6-digit verification code sent to your institution email.</p>
        <div className="mt-6"><StepIndicator currentStep={2} /></div>
        <div className="my-6 flex justify-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600"><MailCheck size={23} aria-hidden="true" /></span></div>
        {developmentCode && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">Development verification code: <strong className="tracking-widest">{developmentCode}</strong></p>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="code" className="mb-1.5 block text-[12px] font-semibold text-[#27364B]">Verification code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? "code-error" : undefined}
            className="focus-ring h-[54px] w-full rounded-lg border border-border text-center text-xl font-semibold tracking-[0.45em] text-navy-900 placeholder:text-[#C6CED8] focus:border-teal-500"
            {...register("code")}
          />
          {errors.code && <p id="code-error" role="alert" className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          {serverError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
          {message && <p role="status" className="mt-3 text-xs text-teal-700">{message}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-5">
            {isSubmitting ? <><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Verifying...</> : <>Verify and continue <span aria-hidden="true">→</span></>}
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">Didn&apos;t receive a code?{" "}
          <button type="button" onClick={resendCode} disabled={cooldown > 0} className="focus-ring rounded font-semibold text-link-blue underline underline-offset-2 disabled:cursor-not-allowed disabled:text-[#9AA5B3]">
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </p>
        <div className="mt-5"><InfoBanner>Verification codes expire after 5 minutes.</InfoBanner></div>
        <Link href="/login" className="focus-ring mx-auto mt-5 flex w-fit items-center gap-1.5 rounded text-xs font-medium text-[#697A8F] hover:text-navy-900"><ArrowLeft size={14} aria-hidden="true" />Back to sign in</Link>
      </section>
    </AuthLayout>
  );
}
