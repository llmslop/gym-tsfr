import { auth } from "./auth";

export const QRCODE_TIMEOUT = 60 * 1000;

export type QRPayload = {
  userId: string;
  userName: string;
  exp: number;
  nonce: string;
};

export class QRSigner {
  privateKey?: CryptoKey;
  publicKey: CryptoKey;

  constructor(opts: { privateKey?: CryptoKey; publicKey: CryptoKey }) {
    this.privateKey = opts.privateKey;
    this.publicKey = opts.publicKey;
  }

  /* ---------------- signing ---------------- */

  async sign(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error("Private key not available for signing");
    }

    const signature = await crypto.subtle.sign(
      { name: "Ed25519" },
      this.privateKey,
      Buffer.from(message, "utf-8"),
    );

    return new Uint8Array(signature).toBase64({ alphabet: "base64url" });
  }

  /* ---------------- verify ---------------- */

  async verify(message: string, signature: string): Promise<boolean> {
    return crypto.subtle.verify(
      { name: "Ed25519" },
      this.publicKey,
      Uint8Array.fromBase64(signature, { alphabet: "base64url" }),
      new TextEncoder().encode(message),
    );
  }

  /* ---------------- payload ---------------- */

  generateQRPayload(session: typeof auth.$Infer.Session): QRPayload {
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(nonce);

    return {
      userId: session.user.id,
      userName: session.user.name,
      exp: Date.now() + QRCODE_TIMEOUT,
      nonce: nonce.toBase64({ alphabet: "base64url" }),
    };
  }

  /* ---------------- token ---------------- */

  async generateToken(session: typeof auth.$Infer.Session): Promise<string> {
    const payload = this.generateQRPayload(session);
    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = new TextEncoder()
      .encode(payloadJson)
      .toBase64({ alphabet: "base64url" });

    const signature = await this.sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  async generateUrl(
    session: typeof auth.$Infer.Session,
    baseUrl: string,
  ): Promise<string> {
    const token = await this.generateToken(session);
    const url = new URL(baseUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }

  async verifyToken(token: string, expCheck?: boolean): Promise<QRPayload> {
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error("Invalid QR token");

    const [payloadB64, sigB64] = parts;

    const ok = await this.verify(payloadB64, sigB64);
    if (!ok) throw new Error("Invalid signature");

    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.fromBase64(payloadB64, { alphabet: "base64url" }),
      ),
    ) as QRPayload;

    // since the server and scanner might have slight time differences,
    // we make the expiration check optional
    if (expCheck !== false && payload.exp < Date.now())
      throw new Error("Expired signature");

    return payload;
  }

  async verifyUrl(url: string, expCheck?: boolean): Promise<QRPayload> {
    // TODO: maybe filter hostname and etc?
    // tbh not really necessary since the token itself is signed
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    if (!token) throw new Error("No token in URL");
    return await this.verifyToken(token, expCheck);
  }

  /* ---------------- factories ---------------- */

  /** Server-side: private + public key */
  static async fromPrivateKey(
    privateKeyBase64: string,
    publicKeyBase64: string,
  ) {
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      Buffer.from(privateKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["sign"],
    );

    const publicKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(publicKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return new QRSigner({ privateKey, publicKey });
  }

  /** Scanner-side: public key only */
  static async fromPublicKey(publicKeyBase64: string) {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(publicKeyBase64, "base64"),
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    return new QRSigner({ publicKey });
  }
}
