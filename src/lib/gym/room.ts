import { ObjectId } from "mongodb";

export const roomTypes = [
  "gym",
  "yoga",
  "aerobic",
  "fitness",
  "boxing",
  "crossfit",
] as const;
export type RoomType = (typeof roomTypes)[number];

export type Room = {
  roomId: string;
  name: string;
  type: RoomType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomWithId<IdType = string> = Room & { _id: IdType };
