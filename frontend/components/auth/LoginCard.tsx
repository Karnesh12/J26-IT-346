"use client";

import Link from "next/link";
import { Building2, LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginValues } from "@/lib/validators";
import { apiRequest, type LoginData } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { AuthLayout } from "./AuthLayout";
import { Divider } from "./Divider";
import { InfoBanner } from "./InfoBanner";
import { PasswordInput } from "./PasswordInput";
import { StepIndicator } from "./StepIndicator";

export function LoginCard() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [institutionBusy, setInstitutionBusy] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError("");
    try {
      const response = await apiRequest<LoginData>("/api/auth/login", values);
      if (response.data?.development_otp) sessionStorage.setItem("bonevision_dev_otp", response.data.development_otp);
      router.push(response.data?.requires_verification ? "/verify" : "/dashboard");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
    }
  };

  const institutionSignIn = async () => {
    setInstitutionBusy(true);
    setServerError("");
    try {
      const result = await fetch("/api/auth/sso/start");
      const body = await result.json() as { success: boolean; message?: string; data?: { redirect_url?: string } };
      if (body.data?.redirect_url) window.location.assign(body.data.redirect_url);
      else setServerError(body.message || "Institution sign-in is not configured yet.");
    } catch {
      setServerError("Unable to connect to institution sign-in.");
    } finally {
      setInstitutionBusy(false);
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[520px] rounded-2xl border border-[#E3E8EF] bg-white px-6 py-7 shadow-card sm:px-10 sm:py-9" aria-labelledby="login-title">
        <div className="mb-5"><Logo centered compact /></div>
        <h2 id="login-title" className="text-center text-[23px] font-semibold tracking-[-0.025em] text-navy-900">Welcome to BoneVision AI</h2>
        <p className="mt-1.5 text-center text-[13px] text-muted">Sign in to your research workspace.</p>
        <div className="mt-6"><StepIndicator currentStep={1} /></div>

        <form className="mt-7 space-y-[17px]" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#27364B]" htmlFor="email">Email address</label>
            <div className={`flex h-[50px] items-center rounded-lg border bg-white transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 ${errors.email ? "border-red-400" : "border-border"}`}>
              <Mail size={17} className="ml-3.5 shrink-0 text-[#8190A4]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@institution.edu"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-full border-0 shadow-none focus:border-0 focus:ring-0"
                {...register("email")}
              />
            </div>
            {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-[12px] font-semibold text-[#27364B]" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="focus-ring rounded text-[11px] font-medium text-link-blue underline underline-offset-2 hover:text-[#074DAB]">Forgot password?</Link>
            </div>
            <PasswordInput id="password" invalid={Boolean(errors.password)} describedBy={errors.password ? "password-error" : undefined} register={register} />
            {errors.password && <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">{errors.password.message}</p>}
          </div>
          {serverError && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs leading-5 text-red-700">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-1">
            {isSubmitting ? <><LoaderCircle size={17} className="animate-spin" aria-hidden="true" />Signing in...</> : <>Sign in <span aria-hidden="true">→</span></>}
          </Button>
        </form>

        <div className="my-5"><Divider /></div>
        <Button variant="secondary" type="button" onClick={institutionSignIn} disabled={institutionBusy}>
          {institutionBusy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Building2 size={17} aria-hidden="true" />}
          Sign in with institution
        </Button>
        <p className="mt-5 text-center text-[12px] text-[#6D7B8E]">
          Don&apos;t have an account?{" "}
          <Link href="/request-access" className="focus-ring rounded font-semibold text-link-blue underline underline-offset-2 hover:text-[#074DAB]">Request access</Link>
        </p>
        <div className="mt-5"><InfoBanner /></div>
      </section>
    </AuthLayout>
  );
}
