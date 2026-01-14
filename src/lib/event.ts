export type EventType = "check-in" | "check-out";
export type Event<IdType = string> = {
  userId: IdType;
  roomId: IdType;
  mode: EventType;
  createdAt: Date;
};

export type EventWithId<IdType = string> = Event<IdType> & {
  _id: IdType;
};
export type EventWithDetails = EventWithId & {
  user?: {
    name: string;
    avatar?: string;
  };
  room?: {
    name: string;
  };
};
