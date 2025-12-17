import { auth } from "@/lib/auth";
import { Elysia, t } from "elysia";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { OpenAPI } from "./auth";
import {
  keyFromPublicAccessUrl,
  publicAccessUrl,
  S3_BUCKET_NAME,
  s3client,
} from "@/lib/s3";
import { z } from "zod";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { roomsRouter } from "./rooms";
import { feedbacksRouter } from "./feedbacks";

const app = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
      references: fromTypes(),
    }),
  )
  .mount(auth.handler)
  .use(roomsRouter)
  .use(feedbacksRouter)
  .post(
    "/avatar/upload",
    async ({ body, request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) throw Error("Unauthorized");

      const file = body.file;
      const path = `user-avatars/${session?.user.id}/${crypto.randomUUID()}`;
      await s3client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: path,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type,
          ACL: "public-read",
        }),
      );

      const oldUser = await db
        .collection("user")
        .findOneAndUpdate(
          { _id: new ObjectId(session.user.id) },
          { $set: { image: publicAccessUrl(path) } },
        );

      if (oldUser !== null) {
        const key = keyFromPublicAccessUrl(oldUser.image as string);
        if (key !== undefined) {
          s3client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: key,
            }),
          );
        }
      }

      return {
        avatarUrl: publicAccessUrl(path),
      };
    },
    {
      body: z.object({
        file: z
          .file()
          .refine((file) => file.size <= 2 * 1024 * 1024, {
            error: "File size must be less than 2MB",
          })
          .refine((file) => file.type.startsWith("image/"), {
            error: "File must be an image",
          }),
      }),
    },
  )
  .post(
    "/biometric/fingerprint/upload",
    async ({ body, request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (!session) throw Error("Unauthorized");

      const file = body.file;
      const path = `user-fingerprint/${session?.user.id}/${crypto.randomUUID()}`;

      await s3client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: path,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type,
          ACL: "public-read",
        }),
      );

      const oldUser = await db
        .collection("user")
        .findOneAndUpdate(
          { _id: new ObjectId(session.user.id) },
          { $set: { fingerprint: publicAccessUrl(path) } },
        );

      if (oldUser !== null) {
        const key = keyFromPublicAccessUrl(oldUser.fingerprint as string);
        if (key !== undefined) {
          s3client.send(
            new DeleteObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: key,
            }),
          );
        }
      }

      return {
        fingerprintFileUrl: publicAccessUrl(path),
      };
    },
    {
      body: z.object({
        file: z.file().refine((file) => file.size <= 512 * 1024, {
          error: "File size must be less than 512 KB",
        }),
      }),
    },
  )
  .get("/", "Hello Nextjs")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

export type App = typeof app;

export const GET = app.fetch;
export const POST = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
