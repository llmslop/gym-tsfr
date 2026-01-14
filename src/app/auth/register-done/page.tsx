"use client";

import { Link } from "@/i18n/navigation";
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";
import { authClient } from "@/lib/auth-client";
import { useSessionStorage } from "usehooks-ts";
import { useMutation } from "@tanstack/react-query";

export default function LoginPage() {
  const [pendingEmail] = useSessionStorage("pendingEmail", "");

  const { mutate: onSubmit, isPending } = useMutation({
    mutationFn: async () => {
      await authClient.sendVerificationEmail({
        email: pendingEmail,
        callbackURL: "/auth/login",
      });
    },
  });

  return (
    <main className="grid grid-cols-1 grid-rows-1 lg:grid-cols-2 items-center min-h-screen group">
      <div className="flex w-full h-full row-start-1 col-start-1 justify-center items-center text-neutral-content bg-cover bg-center bg-linear-to-b from-green-700/90 to-green-950/90 dark:from-lime-700/90 dark:to-lime-950/90">
        <div className="hidden lg:flex flex-col">
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-5xl">Start the journey</h1>
            <h1 className="font-bold text-5xl text-primary mb-16">
              To transform yourself
            </h1>
          </div>

          <div className="flex gap-4">
            <div className="badge badge-primary p-4">
              <CheckBadgeIcon className="size-6" />
              100% Brand New Equipments
            </div>
            <div className="badge badge-primary p-4">
              <CheckBadgeIcon className="size-6" />
              Professional Trainers
            </div>
            <div className="badge badge-primary p-4">
              <CheckBadgeIcon className="size-6" />
              Sauna & Spa
            </div>
          </div>
        </div>
      </div>
      <div className="z-1 row-start-1 col-start-1 lg:col-start-2 flex justify-center items-center m-8">
        <form className="rounded-xl bg-base-200 text-base-content p-8 w-full max-w-md">
          <fieldset className="fieldset">
            <legend className="fieldset-legend flex flex-col items-start mb-4">
              <h1 className="font-bold text-3xl">Verify your email address</h1>
              <p className="font-medium text-base-content/70">
                The final step to get started with GymEmbrace.
              </p>
            </legend>

            <label htmlFor="email" className="font-bold">
              Your registered email address
            </label>
            <div className="mb-4 w-full">
              <div className="relative w-full mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 z-2 animate-pulse">
                  <EnvelopeIcon className="size-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  className="input input-bordered w-full pl-8"
                  disabled={true}
                  value={pendingEmail}
                />
              </div>
            </div>

            <p>
              A verification email has been sent to your email address. Please
              check your inbox and click on the verification link to activate
              your account.
            </p>

            <p>
              If you did not receive the email, please check your spam folder{" "}
              <b>(for real)</b> or click the button below to resend the
              verification email.
            </p>

            <button
              type="button"
              onClick={() => onSubmit()}
              disabled={isPending}
              className="btn btn-primary w-full mt-4 shadow-2xl"
            >
              Resend Verification Email
              <ArrowPathIcon className="size-6" />
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
