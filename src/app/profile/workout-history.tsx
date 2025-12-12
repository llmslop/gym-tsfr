import { MonthPicker, MonthYear } from "@/components/month-picker";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";

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
            const events = generateFakeEvents(date);

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
                  {events.map((ev, idx) => (
                    <div
                      key={idx}
                      className={[
                        "badge badge-xs",
                        ev.className,
                        inCurrentMonth ? "" : "opacity-70",
                      ].join(" ")}
                    >
                      {ev.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}

function Log({ session }: { session: typeof authClient.$Infer.Session }) {}

type WorkoutEvent = {
  label: string;
  className: string; // tailwind bg color
};

function generateFakeEvents(date: Date): WorkoutEvent[] {
  const day = date.getDate();

  // deterministic-ish: stable per day
  const seed = (day * 37 + date.getMonth() * 13) % 7;

  const events: WorkoutEvent[][] = [
    [],
    [{ label: "Rest", className: "badge-primary" }],
    [{ label: "Chest", className: "badge-secondary" }],
    [{ label: "Legs", className: "badge-accent" }],
    [{ label: "Back", className: "badge-neutral" }],
    [
      { label: "Cardio", className: "badge-info" },
      { label: "Abs", className: "badge-success" },
    ],
    [
      { label: "Push", className: "badge-warning" },
      { label: "Stretch", className: "badge-error" },
    ],
  ];

  return events[seed];
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
  const [events, setEvents] = useState<LogEvent[]>([]);

  function eventLabel(ev: LogEvent) {
    switch (ev.type) {
      case "checkin":
        return (
          <span>
            <b>Checked in</b> at {ev.center}
          </span>
        );
      case "checkout":
        return (
          <span>
            <b>Checked out</b> from {ev.center}
          </span>
        );
    }
  }

  const [hasMore, setHasMore] = useState(true);

  const loadingElem = useRef(null);
  useEffect(() => {
    if (!loadingElem.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setTimeout(
            () => {
              if (events.length <= 20) {
                setEvents([...events, ...firstPage]);
              } else {
                setHasMore(false);
              }
            },
            Math.random() * 1000 + 500,
          );
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(loadingElem.current);
    return () => observer.disconnect();
  }, [loadingElem, hasMore, events]);

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full max-w-7xl">
      <legend className="fieldset-legend">Workout log</legend>
      <ul className="grid grid-cols-[auto_auto_1fr] bg-base-100 p-2 text-lg gap-4">
        {events.map((ev, idx) => (
          <Fragment key={`workout-log-event-${idx}`}>
            <div
              key={`event-date-${idx}`}
              className="text-base text-base-content/70"
            >
              {idx + 1 < events.length &&
                dateEquals(ev.time, events[idx + 1].time) &&
                formatDateShort(ev.time)}
            </div>
            <div
              key={`event-time-${idx}`}
              className="text-base text-base-content/70"
            >
              {formatTimeShort(ev.time)}
            </div>
            <div key={`event-label-${idx}`}>{eventLabel(ev)}</div>
          </Fragment>
        ))}
        {hasMore && (
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
      <WorkoutLog session={session} />
    </div>
  );
}
