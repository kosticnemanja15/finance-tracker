"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { LoginSchema, type LoginInput } from "@/schemas/auth";

const inputClass =
  "w-full rounded-btn border border-line bg-surface text-ink px-3 py-2 text-sm " +
  "transition-colors focus:outline-none focus-visible:shadow-[var(--focus)] " +
  "placeholder:text-ink-subtle";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand mark — identitet na auth stranama (nema NavBar ovde) */}
        <div className="flex items-center justify-center gap-2 font-bold text-ink">
          <span className="h-3 w-3 rounded-full bg-brand" />
          Finance Tracker
        </div>

        <div className="rounded-card border border-line bg-surface p-7 shadow-card">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
            <p className="text-sm text-ink-muted">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
              <input id="email" type="email" placeholder="you@example.com" {...register("email")} className={inputClass} />
              {errors.email && <p className="text-sm text-expense">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
              <input id="password" type="password" {...register("password")} className={inputClass} />
              {errors.password && <p className="text-sm text-expense">{errors.password.message}</p>}
            </div>

            {formError && <p className="text-center text-sm text-expense">{formError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-btn bg-brand px-4 py-2.5 text-sm font-medium text-white
                         transition-colors hover:opacity-90 disabled:opacity-50
                         focus-visible:outline-none focus-visible:shadow-[var(--focus)]"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}