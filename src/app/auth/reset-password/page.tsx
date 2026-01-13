"use client";

import { Link, useRouter } from "@/i18n/navigation";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/solid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Logo from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/toast-context";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Auth.resetPassword");
  const tValidation = useTranslations("Auth.validation");
  const formSchema = z
    .object({
      password: z
        .string()
        .min(8, tValidation("passwordMinLength"))
        .default(""),
      confirmPassword: z.string().default(""),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tValidation("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toast = useToast();

  const { mutate: onSubmit, isPending } = useMutation({
    mutationFn: async (formData: z.infer<typeof formSchema>) => {
      const token =
        new URLSearchParams(window.location.search).get("token") ?? undefined;
      const {error} = await authClient.resetPassword({
        newPassword: formData.password,
        token,
      });
      if(error) throw new Error(error.message);
    },
    onError: (err) => toast({ type: "success", message: err.message }),
  });

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
          onSubmit={handleSubmit((values) => onSubmit(values))}
          className="rounded-xl bg-base-200 text-base-content p-8 w-full max-w-md"
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend flex flex-col items-start mb-4">
              <h1 className="font-bold text-3xl">{t("title")}</h1>
              <p className="font-medium text-base-content/70">
                {t("subtitle")}
              </p>
            </legend>

            <label htmlFor="password" className="font-bold">
              New password
            </label>
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
                  placeholder={t("passwordPlaceholder")}
                  className="input input-bordered w-full pl-8"
                  {...register("password")}
                />
              </div>

              {errors.password && (
                <p className="text-error">{errors.password.message}</p>
              )}
            </div>

            <label htmlFor="confirm-password" className="font-bold">
              Confirm Password
            </label>
            <div className="mb-4 w-full">
              <div className="relative w-full mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 z-2 animate-pulse">
                  <ShieldExclamationIcon className="size-4" />
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2 z-2 px-1"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  className="input input-bordered w-full pl-8"
                  {...register("confirmPassword")}
                />
              </div>

              {errors.confirmPassword && watch("confirmPassword") !== "" && (
                <p className="text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary w-full mt-4 shadow-2xl"
            >
              Reset Password
              <LockOpenIcon className="size-4" />
            </button>
          </fieldset>
          <div className="text-center text-sm mt-2">
            Click{" "}
            <Link className="link link-primary" href="/">
              here
            </Link>{" "}
            to go back to the homepage.
          </div>
          <div className="text-center text-xs mt-4 text-base-content/50">
            © 2025 btmxh, Kurogaisha Group. Version 1.2.6
          </div>
        </form>
      </div>
    </main>
  );
}
