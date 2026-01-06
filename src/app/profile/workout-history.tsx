import { MonthPicker, MonthYear } from "@/components/month-picker";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
import { api } from "@/lib/eden";
import { useQuery } from "@tanstack/react-query";

// Type for check-in data
type CheckIn = {
  _id: string;
  userId: string;
  membershipId: string;
  roomId: string | null;
  checkInTime: Date | string;
  checkOutTime: Date | string | null;
  duration: number | null;
  notes: string | null;
  createdAt: Date | string;
};

function WorkoutCalendar({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const t = useTranslations("datetime");
  const dayOfWeek = (dow: number) => t("days." + dow);

  const [month, setMonth] = useState<MonthYear>({ year: 2025, month: 11 });

  // Load workout history từ API
  const { data: historyData } = useQuery({
    queryKey: ["memberships", "history"],
    queryFn: async () => {
      const res = await api.memberships.history.get({ query: { limit: "100" } });
      if (res.status === 200) return res.data;
      return null;
    },
  });

  const checkIns = (historyData?.checkIns ?? []) as CheckIn[];

  // Map check-ins by date
  const checkInsByDate = new Map<string, CheckIn[]>();
  checkIns.forEach((ci) => {
    const date = new Date(ci.checkInTime);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!checkInsByDate.has(key)) {
      checkInsByDate.set(key, []);
    }
    checkInsByDate.get(key)!.push(ci);
  });

  const cells = monthDays(month);

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full max-w-7xl">
      <legend className="fieldset-legend">Workout calendar</legend>

      <div className="flex justify-between w-full items-center">
        <MonthPicker value={month} onChange={setMonth} />
        <button
          className="btn btn-primary"
          onClick={() => {
            setMonth({
              year: new Date().getFullYear(),
              month: new Date().getMonth(),
            });
          }}
        >
          Today
        </button>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-7 text-center font-semibold text-sm opacity-70 mb-1">
          {Array.from({ length: 7 }).map((_, dow) => (
            <div key={`workoutcalendar-${dow}`}>{dayOfWeek(dow)}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, inCurrentMonth }, i) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayCheckIns = checkInsByDate.get(key) ?? [];

            return (
              <div
                key={i}
                className={[
                  "rounded-lg px-2 py-2 flex flex-col items-start justify-start",
                  "border border-base-300",
                  "h-28",
                  inCurrentMonth ? "" : "opacity-40",
                  isToday(date)
                    ? "bg-primary text-primary-content font-bold"
                    : "bg-base-100 hover:bg-base-200 transition",
                ].join(" ")}
              >
                <div className="text-sm">{date.getDate()}</div>

                {/* EVENTS */}
                <div className="flex flex-col gap-1 mt-1 w-full text-xs">
                  {dayCheckIns.map((ci, idx) => {
                    const duration = ci.duration 
                      ? `${Math.floor(ci.duration / 60)}h ${ci.duration % 60}m`
                      : t("status.active");
                    
                    return (
                      <div
                        key={idx}
                        className={[
                          "badge badge-xs",
                          ci.checkOutTime ? "badge-success" : "badge-warning",
                          inCurrentMonth ? "" : "opacity-70",
                        ].join(" ")}
                        title={ci.notes ?? undefined}
                      >
                        {duration}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}

function Log({ session }: { session: typeof authClient.$Infer.Session }) {
  // Load workout history list
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["memberships", "history"],
    queryFn: async () => {
      const res = await api.memberships.history.get({ query: { limit: "20" } });
      if (res.status === 200) return res.data;
      return null;
    },
  });

  const checkIns = (historyData?.checkIns ?? []) as CheckIn[];

  const formatDateTime = (value: Date | string) => {
    const d = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (checkIns.length === 0) {
    return (
      <div className="bg-base-200 border-base-300 rounded-box border p-6 text-center">
        <p className="text-base-content/60">No workout history yet</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 border-base-300 rounded-box border p-4">
      <h3 className="font-semibold mb-3">Recent workouts</h3>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Duration</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.map((ci) => (
              <tr key={ci._id}>
                <td>{formatDateTime(ci.checkInTime)}</td>
                <td>{ci.checkOutTime ? formatDateTime(ci.checkOutTime) : "Active"}</td>
                <td>{formatDuration(ci.duration)}</td>
                <td className="text-sm text-base-content/60">{ci.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type MonthDay = {
  date: Date;
  inCurrentMonth: boolean;
};

function monthDays(monthYear: MonthYear): MonthDay[] {
  const days: MonthDay[] = [];
  const { month, year } = monthYear;

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();

  const nextMonth = (month + 1) % 12;
  const nextYear = month === 11 ? year + 1 : year;
  // previous month ghost days
  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({
      date: new Date(prevYear, prevMonth, prevMonthDays - i),
      inCurrentMonth: false,
    });
  }

  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      inCurrentMonth: true,
    });
  }

  // next month fillers
  const remainder = days.length % 7;
  const needed = remainder === 0 ? 0 : 7 - remainder;
  for (let d = 1; d <= needed; d++) {
    days.push({
      date: new Date(nextYear, nextMonth, d),
      inCurrentMonth: false,
    });
  }

  return days;
}

export function WorkoutHistory({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <div className="flex flex-col gap-8 items-center">
      <WorkoutCalendar session={session} />
      <Log session={session} />
    </div>
  );
}
