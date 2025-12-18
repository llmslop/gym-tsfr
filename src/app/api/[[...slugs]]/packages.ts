import Elysia from "elysia";
import { defaultPackages } from "@/lib/gym/package";

export const packagesRouter = new Elysia({ prefix: "/packages" })
  .get("/list", async () => {
    return defaultPackages.map((pkg, index) => ({
      ...pkg,
      packageId: `pkg-${pkg.duration}`,
      _id: `pkg-${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });