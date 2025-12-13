import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roomTypes, RoomWithId } from "@/lib/gym/room";
import { z } from "zod";
import Elysia from "elysia";
import { ObjectId } from "mongodb";

export const roomsRouter = new Elysia({ prefix: "/rooms" })
  .get("/list", async () => {
    const allRooms = await db.collection("rooms").find().toArray();
    // technically unsafe cast, but the MongoDB ObjectID will be casted into
    // strings after the JSON roundtrip
    return allRooms as unknown as RoomWithId[];
  })
  .get("/:id", async ({ params: { id }, status }) => {
    const room = await db
      .collection("rooms")
      .findOne({ _id: new ObjectId(id) });
    if (room === null) {
      return status(404, { message: "Room not found" });
    }
    return { ...room, _id: room._id.toString() } as RoomWithId;
  })
  .patch(
    "/update/:id",
    async ({ params, body, status, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      // TODO: use a proper permission system
      if (!session || session.user.role !== "admin")
        return status(401, {
          message: "Unauthorized",
        });
      const { id } = params;
      const { name, type, isActive } = body;
      const now = new Date();
      const result = await db.collection("rooms").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            type,
            isActive,
            updatedAt: now,
          },
        },
      );

      if (result.matchedCount === 0) {
        return status(404, { message: "Room not found" });
      }
      return { message: "Room updated successfully" };
    },
    {
      body: z.object({
        name: z.string().min(3).max(100).optional(),
        type: z.enum(roomTypes).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  )
  .delete("/:id", async ({ params: { id }, status, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    // TODO: use a proper permission system
    if (!session || session.user.role !== "admin")
      return status(401, {
        message: "Unauthorized",
      });
    const result = await db
      .collection("rooms")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return status(404, { message: "Room not found" });
    }
    return { message: "Room deleted successfully" };
  })
  .post(
    "/create",
    async ({ status, body, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      // TODO: use a proper permission system
      if (!session || session.user.role !== "admin")
        return status(401, {
          message: "Unauthorized",
        });

      const { name, type, isActive } = body;

      const counter = await db
        .collection<{ _id: string; seq: number }>("counters")
        .findOneAndUpdate(
          { _id: `room-counter` },
          { $inc: { seq: 1 } },
          { upsert: true, returnDocument: "after" },
        );

      if (!counter) throw Error("Counter not found");

      const code = `GE-${counter.seq.toString().padStart(2, "0")}`;
      const now = new Date();

      const doc = await db.collection("rooms").insertOne({
        roomId: code,
        name,
        type,
        isActive,
        createdAt: now,
        updatedAt: now,
      });

      return {
        docId: doc.insertedId,
      };
    },
    {
      body: z.object({
        name: z.string().min(3).max(100),
        type: z.enum(roomTypes),
        isActive: z.boolean().default(true),
      }),
    },
  );
