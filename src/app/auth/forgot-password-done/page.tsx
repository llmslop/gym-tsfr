"use client";

import { Link } from "@/i18n/navigation";
import Logo from "@/components/logo";

export default function LoginPage() {
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
        <div className="rounded-xl bg-base-200 text-base-content p-8 w-full max-w-md text-sm flex flex-col gap-2 text-center">
          <legend className="fieldset-legend flex flex-col items-start mb-3">
            <h1 className="font-bold text-3xl">Verify your email address</h1>
            <p className="font-medium text-base-content/70">
              The final step to get started with GymEmbrace.
            </p>
          </legend>

          <p>
            An email containing the password reset link has been sent to your
            email address. Please check your inbox and click on the reset
            password link to reset your password.
          </p>

          <p>
            If you did not receive the email, please check your spam folder{" "}
            <b>(for real)</b> or click the button below to resend the
            verification email.
          </p>

          <p>
            Click{" "}
            <Link className="link link-primary" href="/">
              here
            </Link>{" "}
            to go back to the homepage.
          </p>
          <div className="text-center text-xs mt-4 text-base-content/50">
            © 2025 btmxh, Kurogaisha Group. Version 1.2.6
          </div>
        </div>
      </div>
    </main>
  );
}
