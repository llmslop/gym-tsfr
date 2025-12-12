"use client";

import { Link } from "@/i18n/navigation";
import {
  ArrowRightEndOnRectangleIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/logo";

export default function LoginPage() {
  const formSchema = z.object({
    email: z.email("Must be a valid email address").default(""),
    password: z
      .string()
      .min(8, "Password must have at least 8 characters")
      .default(""),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      setPending(true);
      setAuthError(null);

      await authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/",
        },
        {
          onError: (context) => {
            setAuthError(context.error.message);
          },
        },
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid grid-cols-1 grid-rows-1 lg:grid-cols-2 items-center min-h-screen group">
      <div className="flex w-full h-full row-start-1 col-start-1 justify-center items-center text-neutral-content bg-cover bg-center bg-linear-to-b from-green-700/90 to-green-950/90 dark:from-lime-700/90 dark:to-lime-950/90">
        <div className="hidden lg:flex flex-col">
          <div className="flex flex-col items-center">
            <Logo className="size-30 mb-16" />
            <h1 className="font-bold text-6xl mb-4 italic">GymEmbrace</h1>
            <div className="h-0.5 bg-primary w-[50%]"></div>
          </div>
        </div>
      </div>
      <div className="z-1 row-start-1 col-start-1 lg:col-start-2 flex justify-center items-center m-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl bg-base-200 text-base-content p-8 w-full max-w-md"
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend flex flex-col items-start mb-4">
              <h1 className="font-bold text-3xl">Welcome back!</h1>
              <p className="font-medium text-base-content/70">
                Please log in to your account to proceed.
              </p>
            </legend>

            {authError && (
              <p className="text-error text-center text-sm space-y-2">
                {authError}
              </p>
            )}

            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <div className="mb-4 w-full">
              <div className="relative w-full mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 z-2 animate-pulse">
                  <EnvelopeIcon className="size-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="Your email here"
                  className="input input-bordered w-full pl-8"
                  {...register("email")}
                />
              </div>

              {errors.email && (
                <p className="text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="password" className="font-bold">
                Password
              </label>

              <Link className="link link-primary" href="/auth/forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className="mb-4 w-full">
              <div className="relative w-full mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 z-2 animate-pulse">
                  <LockClosedIcon className="size-4" />
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2 z-2 px-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password here"
                  className="input input-bordered w-full pl-8"
                  {...register("password")}
                />
              </div>

              {errors.password && (
                <p className="text-error">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary w-full mt-4 shadow-2xl"
            >
              Sign in
              <ArrowRightEndOnRectangleIcon className="size-6" />
            </button>
          </fieldset>
          <div className="flex w-full items-center gap-4 text-base-content/50">
            <div className="h-0.5 bg-base-300 my-6 flex-1"></div>
            <p>Or</p>
            <div className="h-0.5 bg-base-300 my-6 flex-1"></div>
          </div>
          <div className="text-center text-sm">
            Doesn't have an account?{" "}
            <Link className="link link-primary" href="/auth/register">
              Sign up today!
            </Link>
          </div>
          <div className="text-center text-xs mt-4 text-base-content/50">
            © 2025 btmxh, Kurogaisha Group. Version 1.2.6
          </div>
        </form>
      </div>
    </main>
  );
}
