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
import { accessRequestSchema, type AccessRequestValues } from "@/lib/validators";

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AccessRequestValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: { role: "researcher" },
  });

  const onSubmit = async (values: AccessRequestValues) => {
    setServerError("");
    try {
      await apiRequest("/api/auth/request-access", values);
      setSubmitted(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[560px] rounded-2xl border border-[#E3E8EF] bg-white px-6 py-8 shadow-card sm:px-10" aria-labelledby="request-title">
        <div className="mb-5"><Logo centered compact /></div>
        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-600">✓</div>
            <h1 id="request-title" className="text-xl font-semibold text-navy-900">Request received</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Your access request has been sent to an administrator for review.</p>
            <Link href="/login" className="focus-ring mt-6 inline-flex rounded text-sm font-semibold text-link-blue underline underline-offset-2">Return to sign in</Link>
          </div>
        ) : (
          <>
            <h1 id="request-title" className="text-center text-[23px] font-semibold tracking-[-0.025em] text-navy-900">Request research access</h1>
            <p className="mt-1.5 text-center text-[13px] text-muted">Tell us a little about your research team.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-[#27364B]">Full name</label>
                <Input id="name" autoComplete="name" placeholder="Your name" invalid={Boolean(errors.name)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />
                {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#27364B]">Institution email</label>
                <Input id="email" type="email" autoComplete="email" placeholder="name@institution.edu" invalid={Boolean(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="institution" className="mb-1.5 block text-xs font-semibold text-[#27364B]">Institution</label>
                <Input id="institution" autoComplete="organization" placeholder="University or research institution" invalid={Boolean(errors.institution)} aria-invalid={Boolean(errors.institution)} aria-describedby={errors.institution ? "institution-error" : undefined} {...register("institution")} />
                {errors.institution && <p id="institution-error" className="mt-1 text-xs text-red-600">{errors.institution.message}</p>}
              </div>
              <div>
                <label htmlFor="role" className="mb-1.5 block text-xs font-semibold text-[#27364B]">Requested role</label>
                <select id="role" className="focus-ring h-[50px] w-full rounded-lg border border-border bg-white px-3.5 text-sm text-text-dark focus:border-teal-500" {...register("role")}>
                  <option value="researcher">Researcher</option><option value="reviewer">Reviewer</option>
                </select>
              </div>
              <div>
                <label htmlFor="reason" className="mb-1.5 block text-xs font-semibold text-[#27364B]">How will you use BoneVision AI?</label>
                <textarea id="reason" rows={3} placeholder="Briefly describe your research and intended use." className={`focus-ring w-full resize-y rounded-lg border bg-white px-3.5 py-3 text-sm text-text-dark placeholder:text-[#8C98A9] focus:border-teal-500 ${errors.reason ? "border-red-400" : "border-border"}`} aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? "reason-error" : undefined} {...register("reason")} />
                {errors.reason && <p id="reason-error" className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
              </div>
              {serverError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{serverError}</p>}
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><LoaderCircle size={17} className="animate-spin" />Submitting...</> : <>Submit request <span aria-hidden="true">→</span></>}</Button>
            </form>
            <Link href="/login" className="focus-ring mx-auto mt-5 flex w-fit items-center gap-1.5 rounded text-xs font-medium text-[#697A8F] hover:text-navy-900"><ArrowLeft size={14} />Back to sign in</Link>
          </>
        )}
      </section>
    </AuthLayout>
  );
}
