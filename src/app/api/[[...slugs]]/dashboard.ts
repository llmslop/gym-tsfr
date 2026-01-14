import { db } from "@/lib/db";
import Elysia from "elysia";

export const dashboardRouter = new Elysia({ prefix: "/dashboard" })
  .get("/stats", async () => {
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    const [{ totalAmount = 0 } = {}] = await db
      .collection("payments")
      .aggregate([
        {
          $match: {
            paidAt: { $gte: startOfYear, $lt: startOfNextYear },
            status: "paid", // strongly recommended
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    const usersCol = db.collection("user");

    // total members
    const totalMembers = await usersCol.countDocuments({ role: "user" });

    // this month
    const membersThisMonth = await usersCol.countDocuments({
      role: "user",
      createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
    });

    // last month
    const membersLastMonth = await usersCol.countDocuments({
      role: "user",
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    const memberIncreaseValue = membersThisMonth - membersLastMonth;
    const memberIncreasePercentage =
      membersLastMonth === 0
        ? 100
        : Math.round((memberIncreaseValue / membersLastMonth) * 100);

    const totalStaff = await usersCol.countDocuments({
      role: { $in: ["staff"] },
    });

    const staffThisMonth = await usersCol.countDocuments({
      role: { $in: ["staff"] },
      createdAt: { $gte: startOfThisMonth, $lt: startOfNextMonth },
    });

    const staffLastMonth = await usersCol.countDocuments({
      role: { $in: ["staff"] },
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    const staffIncreaseValue = staffThisMonth - staffLastMonth;
    const staffIncreasePercentage =
      staffLastMonth === 0
        ? 100
        : Math.round((staffIncreaseValue / staffLastMonth) * 100);

    return {
      totalRevenue: totalAmount as number,

      totalMembers,
      memberIncrease: {
        value: memberIncreaseValue,
        percentage: memberIncreasePercentage,
      },

      totalStaff,
      staffIncrease: {
        value: staffIncreaseValue,
        percentage: staffIncreasePercentage,
      },
    };
  });
