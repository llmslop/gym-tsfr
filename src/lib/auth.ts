import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import {
  admin,
  createAuthMiddleware,
  emailOTP,
  openAPI,
} from "better-auth/plugins";
import { MongoClient, ObjectId } from "mongodb";
import { resend } from "./resend";
import { PasswordResetEmail } from "@/components/email/password-reset";
import { EmailVerifyEmail as EmailVerificationEmail } from "@/components/email/email-verify";
import { JSX } from "react";
import { client, db } from "./db";

const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",");

async function sendEmail(email: string, subject: string, content: JSX.Element) {
  await resend.emails.send({
    from:
      process.env.EMAIL_ADDR_ACCOUNTS ??
      "GymEmbrace Account Support <accounts.gym-embrace@btmxh.dpdns.org>",
    to: email,
    subject,
    react: content,
  });
}

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      sendEmail(
        user.email,
        "GymEmbrace - Password Reset Request",
        PasswordResetEmail({ url }),
      );
    },
  },
  user: {
    additionalFields: {
      phoneNumber: { type: "string" },
      occupation: { type: "string", required: false },
      birthday: { type: "date", required: false },
      fingerprint: { type: "string", required: false },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  experimental: { joins: true },
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      sendEmail(
        user.email,
        "GymEmbrace - Verify Your Email Address",
        EmailVerificationEmail({ url }),
      );
    },
    async afterEmailVerification(user) {
      if (adminEmails.includes(user.email)) {
        console.log(`Promoting ${user.email} to admin role`);
        db.collection("user").updateOne(
          { _id: new ObjectId(user.id) },
          { $set: { role: "admin" } },
        );
      }
    },
  },
  plugins: [openAPI(), admin()],
});
