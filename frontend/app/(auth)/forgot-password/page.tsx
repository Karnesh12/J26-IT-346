"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { apiRequest } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validators";

type ForgotValues = { email: string };

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const onSubmit = async (values: ForgotValues) => {
    setServerError("");
    try {
      await apiRequest("/api/auth/forgot-password", values);
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[520px] rounded-2xl border border-[#E3E8EF] bg-white px-6 py-9 shadow-card sm:px-10" aria-labelledby="forgot-title">
        <div className="mb-5"><Logo centered compact /></div>
        {submitted ? (
          <div className="py-5 text-center">
            <h1 id="forgot-title" className="text-xl font-semibold text-navy-900">Check your inbox</h1>
            <p className="mt-2 text-sm leading-6 text-muted">If an account matches that email, password reset instructions will be sent shortly.</p>
          </div>
        ) : (
          <>
            <h1 id="forgot-title" className="text-center text-[23px] font-semibold text-navy-900">Reset your password</h1>
            <p className="mt-1.5 text-center text-[13px] leading-5 text-muted">Enter the email address associated with your account.</p>
            <form className="mt-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#27364B]">Email address</label>
              <Input id="email" type="email" autoComplete="email" placeholder="name@institution.edu" invalid={Boolean(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
              {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              {serverError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
              <Button type="submit" disabled={isSubmitting} className="mt-5">{isSubmitting ? <><LoaderCircle size={17} className="animate-spin" />Sending...</> : "Send reset instructions"}</Button>
            </form>
          </>
        )}
        <Link href="/login" className="focus-ring mx-auto mt-6 flex w-fit items-center gap-1.5 rounded text-xs font-medium text-[#697A8F] hover:text-navy-900"><ArrowLeft size={14} />Back to sign in</Link>
      </section>
    </AuthLayout>
  );
}
