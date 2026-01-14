import Elysia, { t } from "elysia";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "./perms";
import { t as translate } from "@/lib/i18n-server";
import { Package, PackageWithId } from "@/lib/gym/package";
import { Payment, PaymentWithId } from "@/lib/gym/trainer";

const PACKAGES_COLLECTION = "packages";
const MEMBERSHIPS_COLLECTION = "memberships";
const PAYMENTS_COLLECTION = "payments";
const CHECK_INS_COLLECTION = "check_ins";
const USERS_COLLECTION = "user";

const paymentMethods = ["cash", "bank-card", "e-wallet"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

// ==================== TYPE DEFINITIONS ====================

type MembershipKind = "duration" | "sessions";
type MembershipStatus = "active" | "expired" | "cancelled";

// Membership document - đơn giản hóa, tách rõ 2 loại
type MembershipDoc = {
  userId: ObjectId;
  packageId: ObjectId;
  kind: MembershipKind;

  // For duration-based memberships
  startAt: Date;
  endAt: Date | null;

  // For session-based memberships
  totalSessions: number | null;
  usedSessions: number | null;

  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
};

// Payment document
type PaymentDoc = {
  userId: ObjectId;
  membershipId: ObjectId;
  packageId: ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: "paid";
  receiptNo: string;
  paidAt: Date;
  createdAt: Date;
};

// Check-in document - theo dõi lịch sử tập luyện thực tế
type CheckInDoc = {
  userId: ObjectId;
  membershipId: ObjectId;
  roomId: ObjectId | null;
  checkInTime: Date;
  checkOutTime: Date | null;
  duration: number | null; // minutes
  notes: string | null;
  createdAt: Date;
};

// ==================== HELPER FUNCTIONS ====================

// Date manipulation helpers
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// Receipt number generator
function generateReceiptNo(now: Date): string {
  const y = now.getFullYear().toString();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `RCPT-${y}${m}${d}-${rand}`;
}

// Member code generator
function generateMemberCode(userId: ObjectId): string {
  const suffix = userId.toString().slice(-6).toUpperCase();
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `MBR-${suffix}-${rand}`;
}

// Parse package duration to membership rules
function packageToRule<T>(pkg: Package<T>):
  | { kind: "duration"; months?: number; years?: number }
  | { kind: "sessions"; sessions: number } {
  const duration: string | undefined = pkg?.duration;

  // Sessions-based packages
  if (duration === "per-session-10") return { kind: "sessions", sessions: 10 };
  if (duration === "pt-10-sessions") return { kind: "sessions", sessions: 10 };

  // Duration-based packages
  if (duration === "1-month") return { kind: "duration", months: 1 };
  if (duration === "3-months") return { kind: "duration", months: 3 };
  if (duration === "6-months") return { kind: "duration", months: 6 };
  if (duration === "1-year") return { kind: "duration", years: 1 };
  if (duration === "vip-1-month") return { kind: "duration", months: 1 };

  // Fallback: treat as 1 month duration
  return { kind: "duration", months: 1 };
}

// Calculate end date for duration-based membership
function calculateEndDate(startDate: Date, rule: { months?: number; years?: number }): Date {
  if (rule.years) return addYears(startDate, rule.years);
  if (rule.months) return addMonths(startDate, rule.months);
  return addMonths(startDate, 1); // default 1 month
}

// Ensure user has member code
async function ensureMemberCode(userId: ObjectId): Promise<string> {
  const existing = await db
    .collection(USERS_COLLECTION)
    .findOne({ _id: userId }, { projection: { memberCode: 1 } });

  if (existing?.memberCode) return existing.memberCode as string;

  const code = generateMemberCode(userId);
  await db
    .collection(USERS_COLLECTION)
    .updateOne({ _id: userId }, { $set: { memberCode: code } });
  return code;
}

// Find active membership (với auto-expire logic)
async function findActiveMembership(userId: ObjectId): Promise<(MembershipDoc & { _id: ObjectId }) | null> {
  const now = new Date();
  const doc = await db
    .collection(MEMBERSHIPS_COLLECTION)
    .findOne<MembershipDoc & { _id: ObjectId }>(
      { userId, status: "active" },
      { sort: { updatedAt: -1 } }
    );

  if (!doc) return null;

  // Auto-expire duration memberships
  if (doc.kind === "duration" && doc.endAt && doc.endAt.getTime() <= now.getTime()) {
    await db.collection(MEMBERSHIPS_COLLECTION).updateOne(
      { _id: doc._id },
      { $set: { status: "expired", updatedAt: now } }
    );
    return null;
  }

  // Auto-expire session memberships
  if (doc.kind === "sessions") {
    const used = doc.usedSessions ?? 0;
    const total = doc.totalSessions ?? 0;
    if (used >= total) {
      await db.collection(MEMBERSHIPS_COLLECTION).updateOne(
        { _id: doc._id },
        { $set: { status: "expired", updatedAt: now } }
      );
      return null;
    }
  }

  return doc;
}

// ==================== API ROUTES ====================

export const membershipsRouter = new Elysia({ prefix: "/memberships" })

  // ===== GET /me - Thông tin membership của user hiện tại =====
  .get("/me", async ({ request: { headers }, status }) => {
    const session = await auth.api.getSession({ headers });
    if (!session) return unauthorized(status);

    const userId = new ObjectId(session.user.id);
    const memberCode = await ensureMemberCode(userId);
    const membership = await findActiveMembership(userId);

    const pkg = membership
      ? await db.collection<PackageWithId<ObjectId>>(PACKAGES_COLLECTION).findOne({ _id: membership.packageId })
      : null;

    const payments = await db
      .collection<Payment<ObjectId>>(PAYMENTS_COLLECTION)
      .find({ userId }, { sort: { paidAt: -1 }, limit: 10 })
      .toArray();

    return {
      memberCode,
      membership: membership ? {
        ...membership,
        _id: membership._id.toString(),
        userId: membership.userId.toString(),
        packageId: membership.packageId.toString(),
        sessionsRemaining: membership.kind === "sessions"
          ? (membership.totalSessions ?? 0) - (membership.usedSessions ?? 0)
          : null,
      } : null,
      package: pkg ? {
        ...pkg,
        _id: pkg._id.toString(),
        packageId: pkg.packageId.toString(),
      } : null,
      payments: payments.map(p => ({
        ...p,
        _id: p._id.toString(),
        userId: p.userId.toString(),
        membershipId: p.membershipId.toString(),
        packageId: p.packageId.toString(),
      })),
    };
  })

  // ===== POST /purchase - Mua gói mới (tạo membership mới) =====
  .post(
    "/purchase",
    async ({ body, request: { headers }, status }) => {
      const session = await auth.api.getSession({ headers });
      if (!session) return unauthorized(status);

      const now = new Date();
      const userId = new ObjectId(session.user.id);

      // Validate package
      const pkg = await db
        .collection<PackageWithId<ObjectId>>(PACKAGES_COLLECTION)
        .findOne({ _id: new ObjectId(body.packageId) });

      if (!pkg) {
        status(404);
        return { message: await translate("API.errors.packageNotFound") };
      }
      if (pkg.isActive !== true) {
        status(400);
        return { message: await translate("API.errors.packageInactive") };
      }

      const memberCode = await ensureMemberCode(userId);
      const rule = packageToRule(pkg);

      // Check if user already has active membership
      const existingMembership = await findActiveMembership(userId);
      if (existingMembership) {
        status(400);
        return { 
          message: await translate("API.errors.alreadyHasActiveMembership")
        };
      }

      // Create new membership
      let membershipDoc: MembershipDoc;

      if (rule.kind === "duration") {
        const startAt = now;
        const endAt = calculateEndDate(startAt, rule);
        membershipDoc = {
          userId,
          packageId: pkg._id,
          kind: "duration",
          startAt,
          endAt,
          totalSessions: null,
          usedSessions: null,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
      } else {
        membershipDoc = {
          userId,
          packageId: pkg._id,
          kind: "sessions",
          startAt: now,
          endAt: null,
          totalSessions: rule.sessions,
          usedSessions: 0,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
      }

      const membershipResult = await db
        .collection(MEMBERSHIPS_COLLECTION)
        .insertOne(membershipDoc);

      const membershipId = membershipResult.insertedId;

      // Create payment record
      const payment: PaymentDoc = {
        userId,
        membershipId,
        packageId: pkg._id,
        amount: pkg.price,
        currency: pkg.currency ?? "VND",
        method: body.paymentMethod,
        status: "paid",
        receiptNo: generateReceiptNo(now),
        paidAt: now,
        createdAt: now,
      };

      await db.collection(PAYMENTS_COLLECTION).insertOne(payment);

      return {
        receiptNo: payment.receiptNo,
        memberCode,
        membership: {
          ...membershipDoc,
          _id: membershipId.toString(),
          userId: membershipDoc.userId.toString(),
          packageId: membershipDoc.packageId.toString(),
        },
      };
    },
    {
      body: t.Object({
        packageId: t.String(),
        paymentMethod: t.Union([
          t.Literal("cash"),
          t.Literal("bank-card"),
          t.Literal("e-wallet"),
        ]),
      }),
    }
  )

  // ===== POST /renew - Gia hạn/mở rộng membership hiện có =====
  .post(
    "/renew",
    async ({ body, request: { headers }, status }) => {
      const session = await auth.api.getSession({ headers });
      if (!session) return unauthorized(status);

      const now = new Date();
      const userId = new ObjectId(session.user.id);

      // Validate package
      const pkg = await db
        .collection<PackageWithId<ObjectId>>(PACKAGES_COLLECTION)
        .findOne({ _id: new ObjectId(body.packageId) });

      if (!pkg) {
        status(404);
        return { message: await translate("API.errors.packageNotFound") };
      }
      if (pkg.isActive !== true) {
        status(400);
        return { message: await translate("API.errors.packageInactive") };
      }

      const memberCode = await ensureMemberCode(userId);
      const rule = packageToRule(pkg);

      // Get current membership
      const currentMembership = await findActiveMembership(userId);

      if (!currentMembership) {
        status(400);
        return { 
          message: await translate("API.errors.noActiveMembershipToRenew")
        };
      }

      let updatedFields: Partial<MembershipDoc>;

      // Renew based on type
      if (rule.kind === "duration") {
        // Extend duration-based membership
        const baseDate = currentMembership.kind === "duration" && currentMembership.endAt && currentMembership.endAt > now
          ? currentMembership.endAt
          : now;

        updatedFields = {
          packageId: pkg._id,
          kind: "duration",
          endAt: calculateEndDate(baseDate, rule),
          totalSessions: null,
          usedSessions: null,
          status: "active",
          updatedAt: now,
        };
      } else {
        // Add more sessions
        const currentTotal = currentMembership.kind === "sessions"
          ? (currentMembership.totalSessions ?? 0)
          : 0;
        const currentUsed = currentMembership.kind === "sessions"
          ? (currentMembership.usedSessions ?? 0)
          : 0;

        updatedFields = {
          packageId: pkg._id,
          kind: "sessions",
          endAt: null,
          totalSessions: currentTotal + rule.sessions,
          usedSessions: currentUsed,
          status: "active",
          updatedAt: now,
        };
      }

      // Update membership
      const updatedMembership = await db
        .collection(MEMBERSHIPS_COLLECTION)
        .findOneAndUpdate(
          { _id: currentMembership._id },
          { $set: updatedFields },
          { returnDocument: "after" }
        );

      // Create payment record
      const payment: PaymentDoc = {
        userId,
        membershipId: currentMembership._id,
        packageId: pkg._id,
        amount: pkg.price,
        currency: pkg.currency ?? "VND",
        method: body.paymentMethod,
        status: "paid",
        receiptNo: generateReceiptNo(now),
        paidAt: now,
        createdAt: now,
      };

      await db.collection(PAYMENTS_COLLECTION).insertOne(payment);

      return {
        receiptNo: payment.receiptNo,
        memberCode,
        membership: updatedMembership ? {
          ...updatedMembership,
          _id: updatedMembership._id.toString(),
          userId: updatedMembership.userId.toString(),
          packageId: updatedMembership.packageId.toString(),
        } : null,
      };
    },
    {
      body: t.Object({
        packageId: t.String(),
        paymentMethod: t.Union([
          t.Literal("cash"),
          t.Literal("bank-card"),
          t.Literal("e-wallet"),
        ]),
      }),
    }
  )

  // ===== POST /check-in - Ghi nhận check-in (cho session-based) =====
  .post(
    "/check-in",
    async ({ body, request: { headers }, status }) => {
      const session = await auth.api.getSession({ headers });
      if (!session) return unauthorized(status);

      const now = new Date();
      const userId = new ObjectId(session.user.id);

      // Get active membership
      const membership = await findActiveMembership(userId);

      if (!membership) {
        status(400);
        return { message: await translate("API.errors.noActiveMembership") };
      }

      // Check if session-based membership has sessions left
      if (membership.kind === "sessions") {
        const used = membership.usedSessions ?? 0;
        const total = membership.totalSessions ?? 0;

        if (used >= total) {
          status(400);
          return { 
            message: await translate("API.errors.noSessionsRemaining")
          };
        }

        // Increment used sessions
        await db.collection(MEMBERSHIPS_COLLECTION).updateOne(
          { _id: membership._id },
          {
            $inc: { usedSessions: 1 },
            $set: { updatedAt: now }
          }
        );
      }

      // Create check-in record
      const checkIn: CheckInDoc = {
        userId,
        membershipId: membership._id,
        roomId: body.roomId ? new ObjectId(body.roomId) : null,
        checkInTime: now,
        checkOutTime: null,
        duration: null,
        notes: body.notes ?? null,
        createdAt: now,
      };

      const result = await db.collection(CHECK_INS_COLLECTION).insertOne(checkIn);

      return {
        checkInId: result.insertedId.toString(),
        checkInTime: now,
        sessionsRemaining: membership.kind === "sessions"
          ? (membership.totalSessions ?? 0) - (membership.usedSessions ?? 0) - 1
          : null,
        message: "Check-in successful",
      };
    },
    {
      body: t.Object({
        roomId: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // ===== POST /check-out - Ghi nhận check-out =====
  .post(
    "/check-out",
    async ({ body, request: { headers }, status }) => {
      const session = await auth.api.getSession({ headers });
      if (!session) return unauthorized(status);

      const now = new Date();
      const userId = new ObjectId(session.user.id);

      // Find latest check-in without check-out
      const checkIn = await db
        .collection(CHECK_INS_COLLECTION)
        .findOne<CheckInDoc & { _id: ObjectId }>(
          {
            userId,
            checkOutTime: null
          },
          { sort: { checkInTime: -1 } }
        );

      if (!checkIn) {
        status(400);
        return { message: await translate("API.errors.noActiveCheckIn") };
      }

      // Calculate duration in minutes
      const durationMs = now.getTime() - checkIn.checkInTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      // Update check-in with check-out time
      await db.collection(CHECK_INS_COLLECTION).updateOne(
        { _id: checkIn._id },
        {
          $set: {
            checkOutTime: now,
            duration: durationMinutes,
            notes: body.notes ?? checkIn.notes,
          }
        }
      );

      return {
        checkInTime: checkIn.checkInTime,
        checkOutTime: now,
        duration: durationMinutes,
        message: "Check-out successful",
      };
    },
    {
      body: t.Object({
        notes: t.Optional(t.String()),
      }),
    }
  )

  // ===== GET /history - Lịch sử tập luyện của user =====
  .get(
    "/history",
    async ({ request: { headers }, query, status }) => {
      const session = await auth.api.getSession({ headers });
      if (!session) return unauthorized(status);

      const userId = new ObjectId(session.user.id);
      const limit = Math.min(parseInt(query.limit ?? "20"), 100);
      const skip = parseInt(query.skip ?? "0");

      const checkIns = await db
        .collection(CHECK_INS_COLLECTION)
        .find({ userId })
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db
        .collection(CHECK_INS_COLLECTION)
        .countDocuments({ userId });

      return {
        total,
        limit,
        skip,
        checkIns: checkIns.map(c => ({
          ...c,
          _id: c._id.toString(),
          userId: c.userId.toString(),
          membershipId: c.membershipId.toString(),
          roomId: c.roomId ? c.roomId.toString() : null,
        })),
      };
    }
  );
