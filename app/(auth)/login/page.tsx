"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, FormField, Input } from "@/components/ui";
import { GoogleIcon } from "@/components/icons";
import { friendlyError, useAuth } from "@/lib/auth-context";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
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
    <Card className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
        </FormField>
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="lg"
        loading={googleLoading}
        onClick={onGoogle}
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-foreground/60">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
