import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { auth } from "./auth";

const getBaseUrl = () => {
  // Client-side: use current origin (supports ngrok)
  if (typeof window !== "undefined") return window.location.origin;
  
  // Server-side: always use localhost (internal call, no SSL issues)
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    emailOTPClient(),
    adminClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});