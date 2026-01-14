import Elysia, { t } from "elysia";
import { defaultPackages, packageDurations } from "@/lib/gym/package";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { t as translate } from "@/lib/i18n-server";

const PACKAGES_COLLECTION = "packages";

// Initialize default packages if collection is empty
async function initializePackages() {
  const count = await db.collection(PACKAGES_COLLECTION).countDocuments();
  if (count === 0) {
    const packagesToInsert = defaultPackages.map((pkg) => ({
      ...pkg,
      packageId: `pkg-${pkg.duration}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await db.collection(PACKAGES_COLLECTION).insertMany(packagesToInsert);
    console.log("Initialized default packages");
  }
}

// Check if user is admin
async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new Error(await translate("API.errors.unauthorized"));
  }

  const user = await db
    .collection("user")
    .findOne({ _id: new ObjectId(session.user.id) });

  if (user?.role !== "admin") {
    throw new Error(await translate("API.errors.forbidden"));
  }

  return session;
}

export const packagesRouter = new Elysia({ prefix: "/packages" })
  .get("/list", async () => {
    await initializePackages();
    const packages = await db
      .collection(PACKAGES_COLLECTION)
      .find({})
      .toArray();

    // Sort by duration (simple, UX-friendly order)
    const durationOrder = {
      "per-session-10": 1,
      "1-month": 2,
      "3-months": 3,
      "6-months": 4,
      "1-year": 5,
      "vip-1-month": 6,
      "pt-10-sessions": 7,
    } as const;
    const sortedPackages = packages.sort((a, b) => {
      const orderA = durationOrder[a.duration as keyof typeof durationOrder] || 999;
      const orderB = durationOrder[b.duration as keyof typeof durationOrder] || 999;
      return orderA - orderB;
    });

    return sortedPackages.map((pkg) => ({
      ...pkg,
      _id: pkg._id.toString(),
    }));
  })
  .post(
    "/create",
    async ({ body, request }) => {
      await requireAdmin(request);

      // If creating a popular package, unset all other popular packages
      if (body.isPopular) {
        await db
          .collection(PACKAGES_COLLECTION)
          .updateMany({ isPopular: true }, { $set: { isPopular: false } });
      }

      const newPackage = {
        packageId: `pkg-${body.duration}-${Date.now()}`,
        duration: body.duration,
        price: body.price,
        currency: body.currency,
        features: body.features,
        isActive: body.isActive,
        isPopular: body.isPopular || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection(PACKAGES_COLLECTION)
        .insertOne(newPackage);

      return {
        ...newPackage,
        _id: result.insertedId.toString(),
      };
    },
    {
      body: t.Object({
        duration: t.Enum(
          packageDurations.reduce((acc, val) => {
            acc[val] = val;
            return acc;
          }, {} as Record<string, string>)
        ),
        price: t.Number({ minimum: 0 }),
        currency: t.String(),
        features: t.Array(t.String()),
        isActive: t.Boolean(),
        isPopular: t.Optional(t.Boolean()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, request }) => {
      await requireAdmin(request);

      // If setting this package as popular, unset all other popular packages
      if (body.isPopular) {
        await db
          .collection(PACKAGES_COLLECTION)
          .updateMany(
            { _id: { $ne: new ObjectId(params.id) }, isPopular: true },
            { $set: { isPopular: false } }
          );
      }

      const updateData = {
        price: body.price,
        features: body.features,
        isActive: body.isActive,
        isPopular: body.isPopular !== undefined ? body.isPopular : false,
        updatedAt: new Date(),
      };

      const result = await db
        .collection(PACKAGES_COLLECTION)
        .findOneAndUpdate(
          { _id: new ObjectId(params.id) },
          { $set: updateData },
          { returnDocument: "after" }
        );

      if (!result) {
        throw new Error(await translate("API.errors.packageNotFound"));
      }

      return {
        ...result,
        _id: result._id.toString(),
      };
    },
    {
      body: t.Object({
        price: t.Number({ minimum: 0 }),
        features: t.Array(t.String()),
        isActive: t.Boolean(),
        isPopular: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete("/:id", async ({ params, request }) => {
    await requireAdmin(request);

    const result = await db
      .collection(PACKAGES_COLLECTION)
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      throw new Error(await translate("API.errors.packageNotFound"));
    }

    return { success: true, message: await translate("API.success.packageDeleted") };
  });