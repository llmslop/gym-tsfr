import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { checkPerm, unauthorized } from "./perms";
import { QRSigner } from "@/lib/qr";
import z from "zod";
import { db } from "@/lib/db";
import { EventWithDetails } from "@/lib/event";
import { ObjectId } from "mongodb";

type SseClient = {
  send: () => void;
};

const eventSseClients = new Map<string, SseClient>();

const qrSigner = await QRSigner.fromPrivateKey(
  process.env.QR_SIGNING_PRIVATE_KEY!,
  process.env.NEXT_PUBLIC_QR_SIGNING_PUBLIC_KEY!,
);

export const eventsRouter = new Elysia({ prefix: "/events" })
  .get("/qrcode", async ({ request: { headers }, status, set }) => {
    set.headers["Cache-Control"] = "no-store";

    const session = await auth.api.getSession({ headers });
    if (!session) return unauthorized(status);
    const url = await qrSigner.generateUrl(
      session,
      "https://gymembrace.app/qr",
    );
    return { url };
  })
  .post(
    "/new",
    async ({ body: { roomId, mode, url }, status, request: { headers } }) => {
      await checkPerm(headers, status, { events: ["create"] });
      try {
        const { userId } = await qrSigner.verifyUrl(url);
        const event = {
          userId: new ObjectId(userId),
          roomId: new ObjectId(roomId),
          mode,
          createdAt: new Date(),
        };
        const res = await db.collection("events").insertOne(event);
        for (const client of eventSseClients.values()) {
          client.send();
        }
        return { docId: res.insertedId };
      } catch (err) {
        return status(400, { message: `${err}` });
      }
    },
    {
      body: z.object({
        roomId: z.string().min(1),
        mode: z.enum(["check-in", "check-out"]),
        url: z.string().min(1),
      }),
    },
  )
  .get(
    "/list",
    async ({ query: { offset, limit } }) => {
      // Add 1 to your limit for the check
      const fetchLimit = limit + 1;

      const events = await db
        .collection("events")
        .aggregate([
          { $sort: { createdAt: -1 } },
          { $skip: offset },
          { $limit: fetchLimit }, // Fetch one extra record
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "rooms",
              localField: "roomId",
              foreignField: "_id",
              as: "room",
            },
          },
          { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              mode: 1,
              createdAt: 1,
              "user.name": 1,
              "user.avatar": 1,
              "room.name": 1,
            },
          },
        ])
        .toArray();

      // Check if we got more than the requested limit
      const hasMore = events.length > limit;

      // If we have an extra item, remove it so the frontend only gets the exact page size
      const results = hasMore ? events.slice(0, limit) : events;

      return {
        events: results as EventWithDetails[],
        hasMore,
      };
    },
    {
      query: z.object({
        offset: z.coerce.number().min(0).default(0),
        limit: z.coerce.number().min(1).max(20).default(20),
      }),
    },
  )
  .get(
    "/list/own",
    async ({ query: { offset, limit }, request: { headers }, status }) => {
      const session = (await checkPerm(headers, status, {
        events: ["read:own"],
      }))!;
      // Add 1 to your limit for the check
      const fetchLimit = limit + 1;

      const events = await db
        .collection("events")
        .aggregate([
          {
            $match: {
              userId: new ObjectId(session.user.id),
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: offset },
          { $limit: fetchLimit }, // Fetch one extra record
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "rooms",
              localField: "roomId",
              foreignField: "_id",
              as: "room",
            },
          },
          { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              mode: 1,
              createdAt: 1,
              "room.name": 1,
            },
          },
        ])
        .toArray();

      // Check if we got more than the requested limit
      const hasMore = events.length > limit;

      // If we have an extra item, remove it so the frontend only gets the exact page size
      const results = hasMore ? events.slice(0, limit) : events;

      return {
        events: results as EventWithDetails[],
        hasMore,
      };
    },
    {
      query: z.object({
        offset: z.coerce.number().min(0).default(0),
        limit: z.coerce.number().min(1).max(20).default(20),
      }),
    },
  )
  .ws("/ws", {
    async upgrade({ request: { headers }, status }) {
      await checkPerm(headers, status, { events: ["read"] });
    },
    async open(ws) {
      eventSseClients.set(ws.id, {
        send: () => {
          ws.sendText("reload");
        },
      });
    },
  });
