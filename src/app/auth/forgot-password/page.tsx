"use client";

import { Link, useRouter } from "@/i18n/navigation";
import {
  ArrowRightEndOnRectangleIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
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
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const [isPending, setPending] = useState(false);

  const router = useRouter();

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      setPending(true);
      await authClient.requestPasswordReset({
        email: formData.email,
        redirectTo: "/auth/reset-password",
      });
    } finally {
      setPending(false);
      router.push("/auth/forgot-password-done");
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
              <h1 className="font-bold text-3xl">Having trouble?</h1>
              <p className="font-medium text-base-content/70">
                Enter your email address to reset your password.
              </p>
            </legend>

            <label htmlFor="email" className="font-bold">
              Email
            </label>
            <div className="w-full">
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

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary w-full shadow-2xl"
            >
              Reset Password
              <LockOpenIcon className="size-4" />
            </button>
          </fieldset>
          <div className="text-center text-xs mt-4 text-base-content/50">
            © 2025 btmxh, Kurogaisha Group. Version 1.2.6
          </div>
        </form>
      </div>
    </main>
  );
}
