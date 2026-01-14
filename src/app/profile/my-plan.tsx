"use client";

import { api } from "@/lib/eden";
import { useRouter } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Package } from "@/lib/gym/package";
import { PaymentWithId } from "@/lib/gym/trainer";

type Membership = {
  _id: string;
  userId: string;
  packageId: string;
  kind: string;
  sessionsRemaining?: number;
  startAt: Date | string;
  endAt: Date | string;
  status: string;
  createdAt: Date | string;
};

function formatMoney(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function formatDateTime(value: Date | string | number) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function MyPlan() {
  const router = useRouter();
  const tMembership = useTranslations("Membership");

  const { data, isPending, isError } = useQuery({
    queryKey: ["memberships", "me"],
    queryFn: async () => {
      const res = await api.memberships.me.get();
      if (res.status !== 200) throw new Error("Failed to load membership");
      return res.data!;
    },
  });

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-48">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="alert alert-error">
        <span>Failed to load membership.</span>
      </div>
    );
  }

  const membership = data.membership as Membership;
  const pkg = data.package as Package;

  if (!membership || !pkg) {
    return (
      <div className="flex flex-col gap-4">
        <div className="alert alert-info">
          <span>You don’t have an active plan yet.</span>
        </div>
        <button className="btn btn-primary w-fit" onClick={() => router.push("/memberships")}
        >
          Choose a plan
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Member code</div>
          <div className="stat-value text-lg font-mono">{data.memberCode}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Current plan</div>
          <div className="stat-value text-lg">
            {tMembership(`durations.${pkg.duration}`)}
          </div>
          <div className="stat-desc">{formatMoney(pkg.price)}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Remaining</div>
          <div className="stat-value text-lg">
            {membership.kind === "sessions"
              ? `${membership.sessionsRemaining ?? 0} sessions`
              : membership.endAt
                ? formatDateTime(membership.endAt)
                : "-"}
          </div>
          <div className="stat-desc">
            {membership.kind === "sessions" ? "sessions left" : "expires at"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={() => router.push("/memberships")}
        >
          Renew / Buy more
        </button>
      </div>

      <div className="bg-base-200 border-base-300 rounded-box border p-4">
        <h3 className="font-semibold mb-3">Recent payments</h3>
        {Array.isArray(data.payments) && data.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: PaymentWithId) => (
                  <tr key={p._id}>
                    <td className="font-mono">{p.receiptNo}</td>
                    <td>{formatMoney(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{formatDateTime(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-base-content/60">No payments yet.</div>
        )}
      </div>
    </div>
  );
}
