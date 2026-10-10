"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input } from "@/components/ui";
import { GoogleIcon } from "@/components/icons";
import { friendlyError, useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { useToast } from "@/components/toast";
import { useOnline } from "@/lib/online";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const online = useOnline();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast("Welcome back!", "success");
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
      {!online && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/20 px-3.5 py-2.5 text-xs font-medium text-amber-200">
          You&apos;re offline. If you have a saved session you&apos;ll be taken straight
          in; otherwise connect to sign in.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            autoComplete="current-password"
            placeholder="••••••••"
            className="bg-slate-900/70 border-white/20 text-white placeholder:text-white/40 focus:border-white focus:ring-white/20"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="mt-1 text-xs font-medium text-rose-300">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950/40 rounded-2xl h-12 text-base transition active:scale-[0.99]"
        >
          Sign in
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
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-200 hover:text-white underline-offset-4 hover:underline transition"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
