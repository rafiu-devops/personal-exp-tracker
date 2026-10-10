"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { GoogleIcon } from "@/components/icons";
import { friendlyError, useAuth } from "@/lib/auth-context";
import { registerSchema, type RegisterValues } from "@/lib/validation";
import { useToast } from "@/components/toast";

export default function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast("Account created. Welcome!", "success");
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast(friendlyError(error), "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/25 bg-slate-950/45 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-white space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/90">Full name</label>
          <Input
            autoComplete="name"
            placeholder="Ahmed Khan"
            className="bg-slate-900/70 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/20"
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="mt-1 text-xs font-medium text-rose-300">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/90">Email</label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="bg-slate-900/70 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/20"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="mt-1 text-xs font-medium text-rose-300">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/90">Password</label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            className="bg-slate-900/70 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/20"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="mt-1 text-xs font-medium text-rose-300">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/90">Confirm password</label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            className="bg-slate-900/70 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/20"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword?.message && (
            <p className="mt-1 text-xs font-medium text-rose-300">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950/40 rounded-2xl h-12 text-base transition active:scale-[0.99]"
        >
          Create account
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-white/60">
        <span className="h-px flex-1 bg-white/20" />
        or
        <span className="h-px flex-1 bg-white/20" />
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="lg"
        loading={googleLoading}
        onClick={onGoogle}
        className="bg-slate-900/70 hover:bg-slate-900/90 border border-white/25 text-white font-semibold rounded-2xl h-12 shadow-md transition active:scale-[0.99]"
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-white/80">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-200 hover:text-white underline-offset-4 hover:underline transition"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
