import { S3Client } from "@aws-sdk/client-s3";

export const s3client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",

  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_ACCESS_SECRET_KEY!,
  },

  endpoint: process.env.S3_ENDPOINT_URL,

  forcePathStyle: true,
});

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "gym-embrace";

export function publicAccessUrl(key: string) {
  return `${process.env.S3_PUBLIC_ACCESS_URL_PREFIX}/${key}`;
}

export function keyFromPublicAccessUrl(url: string): string | undefined {
  const prefix = process.env.S3_PUBLIC_ACCESS_URL_PREFIX;
  if (!prefix) return;

  try {
    const u = new URL(url);
    const p = new URL(prefix);

    // Ensure same origin
    if (u.origin !== p.origin) return;

    // Normalize paths
    const prefixPath = p.pathname.replace(/\/$/, "");
    const urlPath = u.pathname;

    if (!urlPath.startsWith(prefixPath + "/")) return;

    // Extract key
    return urlPath.slice(prefixPath.length + 1);
  } catch {
    return;
  }
}
