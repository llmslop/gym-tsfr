import { auth } from "@/lib/auth";
import { statement } from "@/lib/perms";
import { status as elysiaStatus } from "elysia";

type RoomPerm = (typeof statement)["rooms"][number];
type EquipmentPerm = (typeof statement)["equipments"][number];
type FeedbackPerm = (typeof statement)["feedbacks"][number];

// undefined: no session or no permission
// null: no session, but still authorized as guest
// returns session if authorized
export const checkPerm = async (
  headers: Headers,
  status: typeof elysiaStatus,
  permission: {
    rooms?: RoomPerm[];
    equipments?: EquipmentPerm[];
    feedbacks?: FeedbackPerm[];
  },
) => {
  const session = await auth.api.getSession({ headers });
  const body =
    session === null
      ? ({ role: "guest" } as const)
      : { userId: session.user.id };
  const hasPerm = await auth.api.userHasPermission({
    body: {
      ...body,
      permission,
    },
  });

  if (session === undefined) unauthorized(status);
  else forbidden(status);

  return hasPerm ? session : undefined;
};

export const unauthorized = (status: typeof elysiaStatus) => {
  return status(401, {
    message: "Unauthorized",
  });
};

export const forbidden = (status: typeof elysiaStatus) => {
  return status(403, {
    message: "Forbidden",
  });
};
