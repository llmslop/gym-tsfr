import { Elysia, t } from "elysia";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { t as translate } from "@/lib/i18n-server";

export const staffRouter = new Elysia({ prefix: "/staff" })
  
  // ============ STAFF PROFILES ============
  
  // List all staff
  .get("/", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || (session.user.role !== "admin" && session.user.role !== "staff")) {
      set.status = 403;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const staff = await db
      .collection("staff_profiles")
      .aggregate([
        { $match: { status: { $ne: "terminated" } } },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();
    
    return staff;
  })
  
  // Get staff detail
  .get("/:id", async ({ params, request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || (session.user.role !== "admin" && session.user.role !== "staff")) {
      set.status = 403;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const staff = await db
      .collection("staff_profiles")
      .aggregate([
        { $match: { _id: new ObjectId(params.id) } },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ])
      .toArray();
    
    if (staff.length === 0) {
      set.status = 404;
      return { message: await translate("API.errors.staffNotFound") };
    }
    
    return staff[0];
  })
  
  // Create staff profile
  .post(
    "/",
    async ({ body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session || session.user.role !== "admin") {
        set.status = 403;
        return { message: await translate("API.errors.unauthorized") };
      }
      
      // Check if user exists
      const user = await db
        .collection("user")
        .findOne({ _id: new ObjectId(body.userId) });
      
      if (!user) {
        set.status = 404;
        return { message: await translate("API.errors.userNotFound") };
      }
      
      // Check if staff profile already exists
      const existing = await db
        .collection("staff_profiles")
        .findOne({ userId: new ObjectId(body.userId) });
      
      if (existing) {
        set.status = 400;
        return { message: await translate("API.errors.staffProfileExists") };
      }
      
      const now = new Date();
      const staffProfile = {
        userId: new ObjectId(body.userId),
        role: body.role,
        position: body.position || null,
        department: body.department || null,
        hireDate: new Date(body.hireDate),
        salary: body.salary || null,
        status: "active",
        schedule: body.schedule || [],
        performanceRating: null,
        lastEvaluationDate: null,
        notes: body.notes || null,
        createdAt: now,
        updatedAt: now,
      };
      
      await db.collection("staff_profiles").insertOne(staffProfile);
      
      // Update user role
      await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(body.userId) },
          { $set: { role: body.role, updatedAt: now } }
        );
      
      return { message: await translate("API.success.staffCreated") };
    },
    {
      body: t.Object({
        userId: t.String(),
        role: t.Union([t.Literal("staff"), t.Literal("coach")]),
        position: t.Optional(t.String()),
        department: t.Optional(t.String()),
        hireDate: t.String(),
        salary: t.Optional(t.Number()),
        schedule: t.Optional(t.Array(
          t.Object({
            dayOfWeek: t.Number({ minimum: 0, maximum: 6 }),
            startTime: t.String(),
            endTime: t.String(),
          })
        )),
        notes: t.Optional(t.String()),
      }),
    }
  )
  
  // Update staff profile
  .patch(
    "/:id",
    async ({ params, body, request, set }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session || session.user.role !== "admin") {
        set.status = 403;
        return { message: await translate("API.errors.unauthorized") };
      }
      
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      
      if (body.position !== undefined) updateData.position = body.position;
      if (body.department !== undefined) updateData.department = body.department;
      if (body.salary !== undefined) updateData.salary = body.salary;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.schedule !== undefined) updateData.schedule = body.schedule;
      if (body.notes !== undefined) updateData.notes = body.notes;
      
      await db
        .collection("staff_profiles")
        .updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData }
        );
      
      return { message: await translate("API.success.staffUpdated") };
    },
    {
      body: t.Object({
        position: t.Optional(t.String()),
        department: t.Optional(t.String()),
        salary: t.Optional(t.Number()),
        status: t.Optional(t.Union([
          t.Literal("active"),
          t.Literal("on-leave"),
          t.Literal("terminated"),
        ])),
        schedule: t.Optional(t.Array(
          t.Object({
            dayOfWeek: t.Number({ minimum: 0, maximum: 6 }),
            startTime: t.String(),
            endTime: t.String(),
          })
        )),
        notes: t.Optional(t.String()),
      }),
    }
  )
  
  // ============ ATTENDANCE ============
  
  // Check in
  .post("/attendance/check-in", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const staff = await db
      .collection("staff_profiles")
      .findOne({ userId: new ObjectId(session.user.id), status: "active" });
    
    if (!staff) {
      set.status = 403;
      return { message: await translate("API.errors.notStaffMember") };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await db
      .collection("staff_attendance")
      .findOne({
        staffId: staff._id,
        checkInTime: { $gte: today },
        checkOutTime: null,
      });
    
    if (existing) {
      set.status = 400;
      return { message: await translate("API.errors.alreadyCheckedIn") };
    }
    
    const now = new Date();
    await db.collection("staff_attendance").insertOne({
      staffId: staff._id,
      checkInTime: now,
      checkOutTime: null,
      totalHours: null,
      status: "present",
      notes: null,
      createdAt: now,
    });
    
    return { message: await translate("API.success.checkInSuccess"), time: now };
  })
  
  // Check out
  .post("/attendance/check-out", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const staff = await db
      .collection("staff_profiles")
      .findOne({ userId: new ObjectId(session.user.id), status: "active" });
    
    if (!staff) {
      set.status = 403;
      return { message: await translate("API.errors.notStaffMember") };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await db
      .collection("staff_attendance")
      .findOne({
        staffId: staff._id,
        checkInTime: { $gte: today },
        checkOutTime: null,
      });
    
    if (!attendance) {
      set.status = 400;
      return { message: await translate("API.errors.noActiveCheckIn") };
    }
    
    const now = new Date();
    const hours = (now.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);
    
    await db
      .collection("staff_attendance")
      .updateOne(
        { _id: attendance._id },
        {
          $set: {
            checkOutTime: now,
            totalHours: Math.round(hours * 100) / 100,
          },
        }
      );
    
    return { message: await translate("API.success.checkOutSuccess"), time: now, hours: Math.round(hours * 100) / 100 };
  })
  
  // Get my attendance
  .get("/attendance/my", async ({ request, set }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const staff = await db
      .collection("staff_profiles")
      .findOne({ userId: new ObjectId(session.user.id) });
    
    if (!staff) {
      set.status = 403;
      return { message: await translate("API.errors.notStaffMember") };
    }
    
    const attendance = await db
      .collection("staff_attendance")
      .find({ staffId: staff._id })
      .sort({ checkInTime: -1 })
      .limit(100)
      .toArray();
    
    return attendance;
  })
  
  // Admin: Get all attendance
  .get("/attendance/all", async ({ request, set, query }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      set.status = 403;
      return { message: await translate("API.errors.unauthorized") };
    }
    
    const filter: Record<string, unknown> = {};
    
    if (query.staffId) {
      filter.staffId = new ObjectId(query.staffId);
    }
    
    if (query.from || query.to) {
      const checkInTimeFilter: Record<string, Date> = {};
      if (query.from) checkInTimeFilter.$gte = new Date(query.from);
      if (query.to) checkInTimeFilter.$lte = new Date(query.to);
      filter.checkInTime = checkInTimeFilter;
    }
    
    const attendance = await db
      .collection("staff_attendance")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "staff_profiles",
            localField: "staffId",
            foreignField: "_id",
            as: "staff",
          },
        },
        { $unwind: "$staff" },
        {
          $lookup: {
            from: "user",
            localField: "staff.userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $sort: { checkInTime: -1 } },
        { $limit: 200 },
      ])
      .toArray();
    
    return attendance;
  }, {
    query: t.Object({
      staffId: t.Optional(t.String()),
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
    }),
  });
