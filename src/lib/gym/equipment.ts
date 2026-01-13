export type Equipment<IdType = string> = {
  roomId: IdType;
  name: string;
  quantity: number;
  origin: string;
  warrantyUntil?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EquipmentWithId<IdType = string> = Equipment<IdType> & {
  _id: IdType;
};
