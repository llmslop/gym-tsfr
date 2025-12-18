import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { unauthorized } from "./perms";
import { createHmac, randomBytes } from "crypto";
import { QRCODE_TIMEOUT } from "@/lib/qr";

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET;

type QRPayload = {
  userId: string;
  iat: number;
  exp: number;
  nonce: string;
};

export const eventsRouter = new Elysia({ prefix: "/events" }).get(
  "/qrcode",
  async ({ request: { headers }, status, set }) => {
    set.headers["Cache-Control"] = "no-store";

    const session = await auth.api.getSession({ headers });
    if (!session) return unauthorized(status);
    const payload = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        iat: Date.now(),
        exp: Date.now() + QRCODE_TIMEOUT,
        nonce: randomBytes(16).toString("base64url"),
      } satisfies QRPayload),
      "utf8",
    ).toString("base64url");
    const signature = createHmac("sha256", QR_SIGNING_SECRET!)
      .update(payload)
      .digest("base64url");
    return {
      url: `https://gymembrace.app/checkin?token=${payload}.${signature}`,
    };
  },
);
