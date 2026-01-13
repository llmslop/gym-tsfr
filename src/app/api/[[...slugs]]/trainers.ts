import { Elysia, t } from "elysia";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import {
  TrainerProfile,
  TrainerProfileWithId,
  TrainerAssignment,
  TrainerAssignmentWithId,
  TrainingSession,
  TrainingSessionWithId,
} from "@/lib/gym/trainer";
import { t as translate } from "@/lib/i18n-server";

export const trainersRouter = new Elysia({ prefix: "/trainers" })
  // GET /trainers - List all active trainer profiles (public)
  .get(
    "/",
    async ({ query }) => {
      const { specialization } = query;

      const filter: Record<string, unknown> = { isActive: true };
      if (specialization) {
        filter.specialization = specialization;
      }

      const trainers = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .find(filter)
        .toArray();

      // Populate user info
      const userIds = trainers.map((t) => t.userId);
      const users = await db
        .collection("user")
        .find({ _id: { $in: userIds } })
        .project({ name: 1, email: 1, image: 1 })
        .toArray();

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const trainersWithUser = trainers.map((trainer) => ({
        ...trainer,
        user: userMap.get(trainer.userId.toString()),
      }));

      return trainersWithUser as unknown as TrainerProfileWithId[];
    },
    {
      query: t.Object({
        specialization: t.Optional(t.String()),
      }),
    }
  )

  // GET /trainers/:id - Get trainer profile detail
  .get(
    "/:id",
    async ({ params, set }) => {
      const { id } = params;

      if (!ObjectId.isValid(id)) {
        set.status = 400;
        return { message: await translate("API.errors.invalidTrainerId") };
      }

      const trainer = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .findOne({ _id: new ObjectId(id), isActive: true });

      if (!trainer) {
        set.status = 404;
        return { message: await translate("API.errors.trainerNotFound") };
      }

      // Get user info
      const user = await db
        .collection("user")
        .findOne(
          { _id: trainer.userId },
          { projection: { name: 1, email: 1, image: 1 } }
        );

      // Get assignment stats
      const stats = await db
        .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
        .aggregate([
          { $match: { trainerId: trainer._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const statsMap = Object.fromEntries(
        stats.map((s) => [s._id, s.count])
      );

      return {
        ...trainer,
        user,
        stats: {
          activeClients: statsMap.active || 0,
          completedAssignments: statsMap.completed || 0,
          totalAssignments:
            (statsMap.active || 0) +
            (statsMap.completed || 0) +
            (statsMap.cancelled || 0),
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )

  // POST /trainers/profile - Create/Update trainer profile (Coach only)
  .post(
    "/profile",
    async ({ body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const userId = new ObjectId(session.user.id);

      // Check if user has coach role
      const user = await db.collection("user").findOne({ _id: userId });
      if (user?.role !== "coach" && user?.role !== "admin") {
        set.status = 403;
        return { message: await translate("API.errors.onlyCoachesCanCreateProfile") };
      }

      // Check if profile exists
      const existing = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .findOne({ userId });

      const now = new Date();

      if (existing) {
        // Update existing profile
        await db
          .collection<TrainerProfile<ObjectId>>("trainer_profiles")
          .updateOne(
            { userId },
            {
              $set: {
                ...body,
                updatedAt: now,
              },
            }
          );

        return { message: await translate("API.success.profileUpdated") };
      } else {
        // Create new profile
        const profile: TrainerProfile<ObjectId> = {
          userId,
          ...body,
          createdAt: now,
          updatedAt: now,
        };

        await db
          .collection<TrainerProfile<ObjectId>>("trainer_profiles")
          .insertOne(profile);

        return { message: await translate("API.success.profileCreated") };
      }
    },
    {
      body: t.Object({
        specialization: t.Array(t.String()),
        bio: t.String(),
        certifications: t.Array(t.String()),
        yearsOfExperience: t.Number(),
        availability: t.Array(
          t.Object({
            dayOfWeek: t.Number(),
            startTime: t.String(),
            endTime: t.String(),
          })
        ),
        maxClients: t.Number(),
        isActive: t.Boolean(),
      }),
    }
  )

  // GET /trainers/profile/me - Get my trainer profile (Coach only)
  .get("/profile/me", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const userId = new ObjectId(session.user.id);

    const profile = await db
      .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
      .findOne({ userId });

    if (!profile) {
      set.status = 404;
      return { message: await translate("API.errors.profileNotFound") };
    }

    return profile;
  })

  // POST /trainers/request - Request trainer assignment (Member with active membership)
  .post(
    "/request",
    async ({ body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const memberId = new ObjectId(session.user.id);
      const { trainerId, notes } = body;

      // Check active membership
      const now = new Date();
      const membership = await db.collection("memberships").findOne(
        {
          status: "active",
          $or: [{ userId: memberId }, { userId: session.user.id }],
        },
        { sort: { updatedAt: -1 } }
      );

      if (!membership) {
        set.status = 400;
        return { message: await translate("API.errors.needActiveMembership") };
      }

      if (membership.kind === "duration") {
        if (membership.endAt && new Date(membership.endAt).getTime() <= now.getTime()) {
          set.status = 400;
          return { message: await translate("API.errors.membershipExpired") };
        }
      }

      if (membership.kind === "sessions") {
        const used = membership.usedSessions ?? 0;
        const total = membership.totalSessions ?? 0;
        if (used >= total) {
          set.status = 400;
          return { message: await translate("API.errors.noRemainingSessions") };
        }
      }

      // Check if trainer exists and is active
      const trainer = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .findOne({ _id: new ObjectId(trainerId), isActive: true });

      if (!trainer) {
        set.status = 404;
        return { message: await translate("API.errors.trainerInactive") };
      }

      // Check if trainer has capacity
      const activeCount = await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .countDocuments({
          trainerId: trainer._id,
          status: "active",
        });

      if (activeCount >= trainer.maxClients) {
        set.status = 400;
        return { message: await translate("API.errors.maxClientsReached") };
      }

      // Check if member already has active assignment
      const existingAssignment = await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .findOne({
          memberId,
          status: "active",
        });

      if (existingAssignment) {
        set.status = 400;
        return { message: await translate("API.errors.alreadyHasTrainer") };
      }

      // Create assignment
      const assignment: TrainerAssignment<ObjectId> = {
        trainerId: trainer._id,
        memberId,
        membershipId: membership._id,
        packageId: membership.packageId,
        startDate: new Date(),
        endDate: null,
        totalSessions: membership.totalSessions ?? 0,
        completedSessions: 0,
        status: "pending",
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .insertOne(assignment);

      return { message: await translate("API.success.trainerRequestSent") };
    },
    {
      body: t.Object({
        trainerId: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // GET /trainers/requests/pending - Get pending trainer requests (for trainer)
  .get("/requests/pending", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const userId = new ObjectId(session.user.id);

    // Get trainer profile
    const profile = await db
      .collection<TrainerProfile<ObjectId>>("trainer_profiles")
      .findOne({ userId });

    if (!profile) {
      set.status = 404;
      return { message: await translate("API.errors.trainerProfileNotFound") };
    }

    // Get pending requests for this trainer
    const requests = await db
      .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
      .find({ trainerId: profile._id, status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate member information
    const requestsWithMembers = await Promise.all(
      requests.map(async (request) => {
        const member = await db.collection("user").findOne(
          { _id: request.memberId },
          { projection: { name: 1, email: 1, image: 1, memberCode: 1 } }
        );
        return {
          ...request,
          _id: request._id.toString(),
          trainerId: request.trainerId.toString(),
          memberId: request.memberId.toString(),
          membershipId: request.membershipId.toString(),
          packageId: request.packageId.toString(),
          createdAt: request.createdAt.toISOString(),
          updatedAt: request.updatedAt.toISOString(),
          startDate: request.startDate.toISOString(),
          endDate: request.endDate ? request.endDate.toISOString() : null,
          member: member
            ? {
              id: member._id.toString(),
              name: member.name?.toString(),
              email: member.email?.toString(),
              image: member.image?.toString(),
              memberCode: member.memberCode,
            }
            : null,
        };
      })
    );

    return requestsWithMembers;
  })

  // POST /trainers/requests/:id/accept - Accept a trainer request
  .post("/requests/:id/accept", async ({ params, set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const userId = new ObjectId(session.user.id);

    // Get trainer profile
    const profile = await db
      .collection<TrainerProfile<ObjectId>>("trainer_profiles")
      .findOne({ userId });

    if (!profile) {
      set.status = 404;
      return { message: await translate("API.errors.trainerProfileNotFound") };
    }

    // Verify assignment belongs to this trainer and is pending
    const assignment = await db
      .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
      .findOne({
        _id: new ObjectId(params.id),
        trainerId: profile._id,
        status: "pending",
      });

    if (!assignment) {
      set.status = 404;
      return { message: await translate("API.errors.pendingRequestNotFound") };
    }

    // Check capacity
    const activeCount = await db
      .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
      .countDocuments({
        trainerId: profile._id,
        status: "active",
      });

    if (activeCount >= profile.maxClients) {
      set.status = 400;
      return { message: await translate("API.errors.maxClientCapacityReached") };
    }

    // Accept request
    await db
      .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
      .updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            status: "active",
            startDate: new Date(),
            updatedAt: new Date(),
          },
        }
      );

    return { message: await translate("API.success.requestAccepted") };
  })

  // POST /trainers/requests/:id/reject - Reject a trainer request
  .post(
    "/requests/:id/reject",
    async ({ params, body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const userId = new ObjectId(session.user.id);

      // Get trainer profile
      const profile = await db
        .collection<TrainerProfile<ObjectId>>("trainer_profiles")
        .findOne({ userId });

      if (!profile) {
        set.status = 404;
        return { message: await translate("API.errors.trainerProfileNotFound") };
      }

      // Verify assignment belongs to this trainer and is pending
      const assignment = await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .findOne({
          _id: new ObjectId(params.id),
          trainerId: profile._id,
          status: "pending",
        });

      if (!assignment) {
        set.status = 404;
        return { message: await translate("API.errors.pendingRequestNotFound") };
      }

      // Reject request
      await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .updateOne(
          { _id: new ObjectId(params.id) },
          {
            $set: {
              status: "rejected",
              updatedAt: new Date(),
            },
          }
        );

      return {
        message: body.reason
          ? `Request rejected: ${body.reason}`
          : "Request rejected",
      };
    },
    {
      body: t.Object({
        reason: t.Optional(t.String()),
      }),
    }
  )

  // GET /trainers/my-assignment - Get my current trainer assignment (Member)
  .get("/my-assignment", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const memberId = new ObjectId(session.user.id);

    // Get current assignment (active, pending, or rejected)
    const assignment = await db
      .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
      .findOne({
        memberId,
        status: { $in: ["active", "pending", "rejected"] },
      }, {
        sort: { createdAt: -1 } // Get most recent
      });

    if (!assignment) {
      return null;
    }

    // Get trainer info
    const trainer = await db
      .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
      .findOne({ _id: assignment.trainerId });

    // Get trainer's user info
    const trainerUser = trainer
      ? await db
        .collection("user")
        .findOne(
          { _id: trainer.userId },
          { projection: { name: 1, email: 1, image: 1 } }
        )
      : null;

    // Get package info
    const pkg = await db
      .collection("packages")
      .findOne({ _id: assignment.packageId });

    return {
      ...assignment,
      trainer: trainer ? { ...trainer, user: trainerUser } : null,
      package: pkg,
    };
  })

  // GET /trainers/my-clients - Get my assigned clients (Coach only)
  .get("/my-clients", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const userId = new ObjectId(session.user.id);

    // Get trainer profile
    const profile = await db
      .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
      .findOne({ userId });

    if (!profile) {
      set.status = 404;
      return { message: await translate("API.errors.trainerProfileNotFound") };
    }

    // Get assignments
    const assignments = await db
      .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
      .find({ trainerId: profile._id, status: "active" })
      .toArray();

    // Get member info
    const memberIds = assignments.map((a) => a.memberId);
    const members = await db
      .collection("user")
      .find({ _id: { $in: memberIds } })
      .project({ name: 1, email: 1, image: 1 })
      .toArray();

    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));

    const clientsWithInfo = assignments.map((assignment) => ({
      ...assignment,
      member: memberMap.get(assignment.memberId.toString()),
    }));

    return clientsWithInfo;
  })

  // POST /trainers/sessions/schedule - Schedule a training session (Coach)
  .post(
    "/sessions/schedule",
    async ({ body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const userId = new ObjectId(session.user.id);
      const { assignmentId, sessionDate, duration, exercises } = body;

      // Get trainer profile
      const profile = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .findOne({ userId });

      if (!profile) {
        set.status = 403;
        return { message: await translate("API.errors.trainerProfileNotFound") };
      }

      // Verify assignment belongs to this trainer
      const assignment = await db
        .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
        .findOne({
          _id: new ObjectId(assignmentId),
          trainerId: profile._id,
          status: "active",
        });

      if (!assignment) {
        set.status = 404;
        return { message: await translate("API.errors.assignmentNotActive") };
      }

      // Create training session
      const now = new Date();
      const trainingSession: TrainingSession<ObjectId> = {
        assignmentId: assignment._id,
        trainerId: profile._id,
        memberId: assignment.memberId,
        sessionDate: new Date(sessionDate),
        duration,
        exercises,
        trainerNotes: null,
        memberFeedback: null,
        memberRating: null,
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      };

      await db
        .collection<TrainingSession<ObjectId>>("training_sessions")
        .insertOne(trainingSession);

      return { message: await translate("API.success.sessionScheduled") };
    },
    {
      body: t.Object({
        assignmentId: t.String(),
        sessionDate: t.String(),
        duration: t.Number(),
        exercises: t.Array(
          t.Object({
            name: t.String(),
            sets: t.Number(),
            reps: t.Number(),
            weight: t.Optional(t.Number()),
            notes: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // POST /trainers/sessions/:id/complete - Mark session as completed (Coach)
  .post(
    "/sessions/:id/complete",
    async ({ params, body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const userId = new ObjectId(session.user.id);
      const { id } = params;
      const { trainerNotes, exercises } = body;

      if (!ObjectId.isValid(id)) {
        set.status = 400;
        return { message: await translate("API.errors.invalidSessionId") };
      }

      // Get trainer profile
      const profile = await db
        .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
        .findOne({ userId });

      if (!profile) {
        set.status = 403;
        return { message: await translate("API.errors.trainerProfileNotFound") };
      }

      // Get session
      const trainingSession = await db
        .collection<TrainingSessionWithId<ObjectId>>("training_sessions")
        .findOne({
          _id: new ObjectId(id),
          trainerId: profile._id,
        });

      if (!trainingSession) {
        set.status = 404;
        return { message: await translate("API.errors.sessionNotFound") };
      }

      if (trainingSession.status === "completed") {
        set.status = 400;
        return { message: await translate("API.errors.sessionAlreadyCompleted") };
      }

      // Update session
      await db
        .collection<TrainingSession>("training_sessions")
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "completed",
              trainerNotes,
              exercises,
              updatedAt: new Date(),
            },
          }
        );

      // Update assignment completed sessions count
      await db
        .collection<TrainerAssignment>("trainer_assignments")
        .updateOne(
          { _id: trainingSession.assignmentId },
          { $inc: { completedSessions: 1 } }
        );

      return { message: await translate("API.success.sessionCompleted") };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        trainerNotes: t.String(),
        exercises: t.Array(
          t.Object({
            name: t.String(),
            sets: t.Number(),
            reps: t.Number(),
            weight: t.Optional(t.Number()),
            notes: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // POST /trainers/sessions/:id/feedback - Add member feedback and rating
  .post(
    "/sessions/:id/feedback",
    async ({ params, body, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const memberId = new ObjectId(session.user.id);
      const { id } = params;
      const { memberFeedback, memberRating } = body;

      if (!ObjectId.isValid(id)) {
        set.status = 400;
        return { message: await translate("API.errors.invalidSessionId") };
      }

      // Get session
      const trainingSession = await db
        .collection<TrainingSessionWithId<ObjectId>>("training_sessions")
        .findOne({
          _id: new ObjectId(id),
          memberId,
          status: "completed",
        });

      if (!trainingSession) {
        set.status = 404;
        return { message: await translate("API.errors.sessionNotCompleted") };
      }

      // Update feedback
      await db
        .collection<TrainingSession<ObjectId>>("training_sessions")
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              memberFeedback,
              memberRating,
              updatedAt: new Date(),
            },
          }
        );

      return { message: await translate("API.success.feedbackSubmitted") };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        memberFeedback: t.String(),
        memberRating: t.Number({ minimum: 1, maximum: 5 }),
      }),
    }
  )

  // GET /trainers/sessions/my - Get my training sessions (Member)
  .get("/sessions/my", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const memberId = new ObjectId(session.user.id);

    const sessions = await db
      .collection<TrainingSessionWithId<ObjectId>>("training_sessions")
      .find({ memberId })
      .sort({ sessionDate: -1 })
      .toArray();

    // Get trainer info for each session
    const trainerIds = [...new Set(sessions.map((s) => s.trainerId))];
    const trainers = await db
      .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
      .find({ _id: { $in: trainerIds } })
      .toArray();

    const trainerMap = new Map(trainers.map((t) => [t._id.toString(), t]));

    const sessionsWithTrainer = sessions.map((s) => ({
      ...s,
      trainer: trainerMap.get(s.trainerId.toString()),
    }));

    return sessionsWithTrainer;
  })

  // GET /trainers/sessions/clients - Get sessions for my clients (Coach)
  .get("/sessions/clients", async ({ set, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      set.status = 401;
      return { message: await translate("API.errors.unauthorized") };
    }

    const userId = new ObjectId(session.user.id);

    // Get trainer profile
    const profile = await db
      .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
      .findOne({ userId });

    if (!profile) {
      set.status = 404;
      return { message: await translate("API.errors.trainerProfileNotFound") };
    }

    const sessions = await db
      .collection<TrainingSessionWithId<ObjectId>>("training_sessions")
      .find({ trainerId: profile._id })
      .sort({ sessionDate: -1 })
      .toArray();

    // Get member info
    const memberIds = [...new Set(sessions.map((s) => s.memberId))];
    const members = await db
      .collection("user")
      .find({ _id: { $in: memberIds } })
      .project({ name: 1, email: 1, image: 1 })
      .toArray();

    const memberMap = new Map(members.map((m) => [m._id.toString(), m]));

    const sessionsWithMember = sessions.map((s) => ({
      ...s,
      member: memberMap.get(s.memberId.toString()),
    }));

    return sessionsWithMember;
  })

  // DELETE /trainers/assignments/:id - Cancel assignment (Admin or Coach)
  .delete(
    "/assignments/:id",
    async ({ params, set, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session?.user?.id) {
        set.status = 401;
        return { message: await translate("API.errors.unauthorized") };
      }

      const userId = new ObjectId(session.user.id);
      const { id } = params;

      if (!ObjectId.isValid(id)) {
        set.status = 400;
        return { message: await translate("API.errors.invalidAssignmentId") };
      }

      // Check if user is admin or the assigned coach
      const user = await db.collection("user").findOne({ _id: userId });
      const isAdmin = user?.role === "admin";

      let assignment: TrainerAssignmentWithId<ObjectId> | null = null;

      if (isAdmin) {
        assignment = await db
          .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
          .findOne({ _id: new ObjectId(id) });
      } else {
        // Check if this is the assigned trainer
        const profile = await db
          .collection<TrainerProfileWithId<ObjectId>>("trainer_profiles")
          .findOne({ userId });

        if (!profile) {
          set.status = 403;
          return { message: await translate("API.errors.notAuthorized") };
        }

        assignment = await db
          .collection<TrainerAssignmentWithId<ObjectId>>("trainer_assignments")
          .findOne({
            _id: new ObjectId(id),
            trainerId: profile._id,
          });
      }

      if (!assignment) {
        set.status = 404;
        return { message: await translate("API.errors.assignmentNotFound") };
      }

      // Cancel assignment
      await db
        .collection<TrainerAssignment<ObjectId>>("trainer_assignments")
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "cancelled",
              endDate: new Date(),
              updatedAt: new Date(),
            },
          }
        );

      return { message: await translate("API.success.assignmentCancelled") };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
