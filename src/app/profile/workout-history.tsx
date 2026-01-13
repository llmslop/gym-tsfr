import { MonthPicker, MonthYear } from "@/components/month-picker";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/eden";
import { EventWithDetails } from "@/lib/event";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
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

type LogEvent = {
  type: "checkin" | "checkout";
  center: string;
  time: Date;
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDateShort(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = ordinal(date.getDate());
  return `${month} ${day}`;
}

function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateEquals(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

const firstPage: LogEvent[] = [
  {
    type: "checkout",
    center: "Downtown Gym",
    time: new Date(2025, 12, 29, 13, 30, 0),
  },
  {
    type: "checkin",
    center: "Downtown Gym",
    time: new Date(2025, 12, 29, 10, 30, 0),
  },
  {
    type: "checkout",
    center: "Uptown Fitness",
    time: new Date(2025, 12, 28, 11, 0, 0),
  },
  {
    type: "checkin",
    center: "Uptown Fitness",
    time: new Date(2025, 12, 28, 9, 0, 0),
  },
];

function WorkoutLog({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const limit = 5;
  const {
    data: events,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["workout-log", session.user.id],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const { data, error, status } = await api.events.list.own.get({
        query: {
          offset: pageParam ?? 0,
          limit,
        },
      });
      if (status === 200) {
        return data!;
      }
      throw new Error(error?.value?.message ?? "Failed to fetch workout log");
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.hasMore) return undefined;
      return allPages.length * limit; // next offset
    },
  });
  // const [events, setEvents] = useState<LogEvent[]>([]);

  function eventLabel(ev: EventWithDetails) {
    switch (ev.mode) {
      case "check-in":
        return (
          <span>
            <b>Checked in</b> at {ev.room?.name}
          </span>
        );
      case "check-out":
        return (
          <span>
            <b>Checked out</b> from {ev.room?.name}
          </span>
        );
    }
  }

  const loadingElem = useRef(null);
  useEffect(() => {
    if (!loadingElem.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(loadingElem.current);
    return () => observer.disconnect();
  }, [loadingElem, events, fetchNextPage]);

  const allEvents =
    events === undefined ? [] : events.pages.flatMap((page) => page.events);

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full max-w-7xl">
      <legend className="fieldset-legend">Workout log</legend>
      <ul className="grid grid-cols-[auto_auto_1fr] bg-base-200 p-2 text-lg">
        {allEvents.map((ev, idx) => (
          <div
            key={`workout-log-event-${idx}`}
            className="hover:bg-base-300 grid grid-cols-subgrid col-start-1 -col-end-1 p-2 gap-2 items-baseline"
          >
            <div
              key={`event-date-${idx}`}
              className="text-base text-base-content/70"
            >
              {(idx === 0 ||
                !dateEquals(ev.createdAt, allEvents[idx - 1].createdAt)) &&
                formatDateShort(ev.createdAt)}
            </div>
            <div
              key={`event-time-${idx}`}
              className="text-base text-base-content/70"
            >
              {formatTimeShort(ev.createdAt)}
            </div>
            <div key={`event-label-${idx}`}>{eventLabel(ev)}</div>
          </div>
        ))}
        {hasNextPage && (
          <div className="flex justify-center col-span-3" ref={loadingElem}>
            <span className="loading loading-dots loading-md"></span>
          </div>
        )}
      </ul>
    </fieldset>
  );
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
