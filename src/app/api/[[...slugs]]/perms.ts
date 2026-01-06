import { auth } from "@/lib/auth";
import { statement } from "@/lib/perms";
import { status as elysiaStatus } from "elysia";
import { t as translate } from "@/lib/i18n-server";

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

  if (!hasPerm) {
    if (session === undefined) {
      return await unauthorized(status);
    } else {
      return await forbidden(status);
    }
  }

  return session;
};

export const unauthorized = async (status: typeof elysiaStatus) => {
  return status(401, {
    message: await translate("API.errors.unauthorized"),
  });
};

export const forbidden = async (status: typeof elysiaStatus) => {
  return status(403, {
    message: await translate("API.errors.forbidden"),
  });
};
