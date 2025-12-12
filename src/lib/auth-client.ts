import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    emailOTPClient(),
    adminClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
