import { db } from "@/lib/db";
import { roomTypes, RoomWithId } from "@/lib/gym/room";
import { z } from "zod";
import Elysia from "elysia";
import { ObjectId } from "mongodb";
import { Equipment, EquipmentWithId } from "@/lib/gym/equipment";
import { checkPerm } from "./perms";
import { t as translate } from "@/lib/i18n-server";

export const roomsRouter = new Elysia({ prefix: "/rooms" })
  .get("/list", async ({ status, request: { headers } }) => {
    await checkPerm(headers, status, { rooms: ["read"] });
    const allRooms = await db.collection("rooms").find().toArray();
    // technically unsafe cast, but the MongoDB ObjectID will be casted into
    // strings after the JSON roundtrip
    return allRooms as unknown as RoomWithId[];
  })
  .get("/:id", async ({ params: { id }, request: { headers }, status }) => {
    await checkPerm(headers, status, { rooms: ["read"] });
    const room = await db
      .collection("rooms")
      .findOne({ _id: new ObjectId(id) });
    if (room === null) {
      return status(404, { message: await translate("API.errors.roomNotFound") });
    }
    return { ...room, _id: room._id.toString() } as RoomWithId;
  })
  .get(
    "/:id/equipments/list",
    async ({
      params: { id },
      request: { headers },
      query: { offset, limit },
      status,
    }) => {
      await checkPerm(headers, status, { equipments: ["read"] });
      const data = await db
        .collection("equipments")
        .find({ roomId: new ObjectId(id) })
        .skip(offset)
        .limit(limit + 1)
        .toArray();
      const hasMore = data.length > limit;
      if (hasMore) {
        data.pop();
      }
      return {
        data: data as unknown as EquipmentWithId[],
        hasMore,
      };
    },
    {
      query: z.object({
        offset: z.coerce.number().min(0),
        limit: z.coerce.number().min(1).max(20),
      }),
    },
  )
  .patch(
    "/update/:id",
    async ({
      params: { id },
      body: { name, type, isActive },
      status,
      request: { headers },
    }) => {
      await checkPerm(headers, status, { rooms: ["update"] });
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
        return status(404, { message: await translate("API.errors.roomNotFound") });
      }
      return { message: await translate("API.success.roomUpdated") };
    },
    {
      body: z.object({
        name: z.string().min(3).max(100).optional(),
        type: z.enum(roomTypes).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  )
  .patch(
    "/:id/equipments/:equipmentId/update",
    async ({
      status,
      params: { id, equipmentId },
      body: { newRoomId, name, quantity, origin, warrantyUntil, isActive },
      request: { headers },
    }) => {
      await checkPerm(headers, status, { equipments: ["update"] });

      const roomId = newRoomId ?? id;
      const now = new Date();

      const result = await db.collection("equipments").updateOne(
        { _id: new ObjectId(equipmentId), roomId: new ObjectId(id) },
        {
          $set: {
            roomId: roomId ? new ObjectId(roomId) : undefined,
            name,
            quantity,
            origin,
            warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : undefined,
            isActive,
            updatedAt: now,
          },
        },
      );

      if (result.matchedCount === 0) {
        return status(404, { message: await translate("API.errors.equipmentNotFound") });
      }
      return { message: await translate("API.success.equipmentUpdated") };
    },
    {
      body: z.object({
        newRoomId: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        origin: z.string().min(1, "Origin is required"),
        warrantyUntil: z.preprocess(
          (arg) => (arg === "" ? undefined : arg),
          z.iso.date().optional(),
        ),
        isActive: z.boolean(),
      }),
    },
  )
  .delete("/:id", async ({ params: { id }, status, request: { headers } }) => {
    await checkPerm(headers, status, { rooms: ["delete"] });
    const result = await db
      .collection("rooms")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return status(404, { message: await translate("API.errors.roomNotFound") });
    }
    return { message: await translate("API.success.roomDeleted") };
  })
  .delete(
    "/:id/equipments/:equipmentId",
    async ({ params: { id, equipmentId }, status, request: { headers } }) => {
      await checkPerm(headers, status, { equipments: ["delete"] });
      const result = await db.collection("equipments").findOneAndDelete({
        _id: new ObjectId(equipmentId),
        roomId: new ObjectId(id),
      });
      if (result === null) {
        return status(404, { message: await translate("API.errors.equipmentWrongRoom") });
      }
      return { message: await translate("API.success.equipmentDeleted") };
    },
  )
  .post(
    "/create",
    async ({
      status,
      body: { name, type, isActive },
      request: { headers },
    }) => {
      await checkPerm(headers, status, { rooms: ["create"] });

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
  )
  .post(
    "/:id/equipments/add",
    async ({
      status,
      params: { id },
      body: { name, quantity, origin, warrantyUntil, isActive },
      request: { headers },
    }) => {
      await checkPerm(headers, status, { equipments: ["create"] });

      const now = new Date();

      const doc = await db.collection("equipments").insertOne({
        roomId: new ObjectId(id),
        name,
        quantity,
        origin,
        warrantyUntil: warrantyUntil ? new Date(warrantyUntil) : undefined,
        isActive,
        createdAt: now,
        updatedAt: now,
      } satisfies Equipment<ObjectId>);

      return {
        docId: doc.insertedId,
      };
    },
    {
      body: z.object({
        name: z.string().min(1, "Name is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        origin: z.string().min(1, "Origin is required"),
        warrantyUntil: z.preprocess(
          (arg) => (arg === "" ? undefined : arg),
          z.iso.date().optional(),
        ),
        isActive: z.boolean(),
      }),
    },
  );
