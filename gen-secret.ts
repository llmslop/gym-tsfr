import { generateKeyPairSync } from "crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");

// Export as base64 for storage / env vars / QR scanners
const publicKeyBase64 = publicKey
  .export({
    format: "der",
    type: "spki",
  })
  .toString("base64");

const privateKeyBase64 = privateKey
  .export({
    format: "der",
    type: "pkcs8",
  })
  .toString("base64");

console.log("NEXT_PUBLIC_QR_SIGNING_PUBLIC_KEY=" + publicKeyBase64);
console.log("QR_SIGNING_PRIVATE_KEY=" + privateKeyBase64);
