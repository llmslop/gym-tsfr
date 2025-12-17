import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Feedback,
  FeedbackWithAuthorAndId,
  FeedbackWithId,
} from "@/lib/gym/feedback";
import Elysia from "elysia";
import { ObjectId } from "mongodb";
import { z } from "zod";

type SseClient = {
  send: () => void;
};

const feedbackSseClients = new Map<string, Map<string, SseClient>>();

export const feedbacksRouter = new Elysia({ prefix: "/feedbacks" })
  .post(
    "/new",
    async ({ body: { title, body }, status, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return status(401, { message: "Unauthorized" });
      const isMemberFeedback = session.user.role === "member";
      const now = new Date();

      const feedback = {
        isMemberFeedback,
        authorId: new ObjectId(session.user.id),
        title,
        body,
        createdAt: now,
        updatedAt: now,
      };

      const feedbackResult = await db
        .collection("feedbacks")
        .insertOne(feedback);
      const updateIdResult = await db
        .collection("feedbacks")
        .updateOne(
          { _id: feedbackResult.insertedId },
          { $set: { threadId: feedbackResult.insertedId } },
        );
      if (updateIdResult.modifiedCount === 0) {
        return status(500, { message: "Failed to set threadId" });
      }

      return {
        docId: feedbackResult.insertedId,
      };
    },
    {
      body: z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    },
  )
  .post(
    "/:id/reply",
    async ({ body: { title, body }, params: { id }, status, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return status(401, { message: "Unauthorized" });
      const isMemberFeedback = session.user.role === "member";
      const now = new Date();

      const feedback = {
        isMemberFeedback,
        threadId: new ObjectId(id),
        authorId: new ObjectId(session.user.id),
        title,
        body,
        createdAt: now,
        updatedAt: now,
      };

      const feedbackResult = await db
        .collection("feedbacks")
        .insertOne(feedback);

      const clients =
        feedbackSseClients.get(id) ?? new Map<string, SseClient>();
      for (const client of clients.values()) {
        client.send();
      }

      return {
        docId: feedbackResult.insertedId,
      };
    },
    {
      body: z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    },
  )
  .get(
    "/list",
    async ({ query: { offset, limit } }) => {
      const data = await db
        .collection("feedbacks")
        .aggregate<FeedbackWithAuthorAndId>([
          {
            $match: {
              $expr: { $eq: ["$threadId", "$_id"] },
            },
          },
          {
            $lookup: {
              from: "user",
              let: { authorId: "$authorId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$authorId"] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                  },
                },
              ],
              as: "author",
            },
          },
          { $unwind: "$author" },

          // deterministic order FIRST
          { $sort: { createdAt: -1 } },

          // pagination
          { $skip: offset },
          { $limit: limit + 1 }, // fetch one extra to detect hasMore
        ])
        .toArray();

      const hasMore = data.length > limit;
      if (hasMore) data.pop();

      return {
        data,
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
  .get("/:id", async ({ params: { id } }) => {
    const feedbacks = await db
      .collection("feedbacks")
      .aggregate<FeedbackWithAuthorAndId>([
        {
          $match: { threadId: new ObjectId(id) },
        },
        {
          $lookup: {
            from: "user",
            let: { authorId: "$authorId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$authorId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                },
              },
            ],
            as: "author",
          },
        },
        { $unwind: "$author" },
        { $sort: { createdAt: 1 } },
      ])
      .toArray();
    return feedbacks;
  })
  .ws("/:id/ws", {
    open(ws) {
      if (!feedbackSseClients.has(ws.data.params.id)) {
        feedbackSseClients.set(ws.data.params.id, new Map());
      }
      feedbackSseClients.get(ws.data.params.id)?.set(ws.id, {
        send() {
          ws.sendText("reload");
        },
      });
    },
    close(ws) {
      feedbackSseClients.get(ws.data.params.id)?.delete(ws.id);
    },
  });
