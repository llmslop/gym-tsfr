import { ObjectId } from "mongodb";

export type Equipment<IdType = string> = {
  roomId: IdType;
  name: string;
  quantity: number;
  origin: string;
  warrantyUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EquipmentWithId<IdType = string> = Equipment<IdType> & {
  _id: IdType;
};
