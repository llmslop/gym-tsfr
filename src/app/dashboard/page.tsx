"use client";

import { PresentationChartBarIcon } from "@heroicons/react/24/solid";
import { useFormatter } from "next-intl";
import { useEffect } from "react";
import { EventWithDetails } from "@/lib/event";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/eden";

function dateEquals(d1: Date, d2: Date) {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function RecentActivity() {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { status, data, error } = await api.events.list.get({
        query: { offset: 0, limit: 20 },
      });
      if (status === 200) return data ?? { events: [], hasMore: false };
      throw new Error(error?.value?.message ?? "Failed to fetch events");
    },
  });

  function eventLabel(ev: EventWithDetails) {
    switch (ev.mode) {
      case "check-in":
        return (
          <span>
            {ev.user?.name} <b>checked in</b> from <i>{ev.room?.name}</i>
          </span>
        );
      case "check-out":
        return (
          <span>
            {ev.user?.name} <b>checked out</b> from <i>{ev.room?.name}</i>
          </span>
        );
    }
  }

  const formatter = useFormatter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = api.events.ws.subscribe();
    ws.subscribe(({ data }) => {
      if (data === "reload") {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }
    });
    return () => ws.close();
  }, [queryClient]);

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full max-w-7xl">
      <legend className="fieldset-legend">Recent activities</legend>
      {events ? (
        <ul className="grid grid-cols-[auto_auto_1fr] bg-base-200 p-2 text-lg">
          {events.events.map((ev, idx) => (
            <div
              key={`event-${idx}`}
              className="hover:bg-base-300 grid grid-cols-subgrid col-start-1 -col-end-1 p-2 gap-2 items-baseline"
            >
              <div className="text-base text-base-content/70">
                {(idx === 0 ||
                  !dateEquals(
                    ev.createdAt,
                    events.events[idx - 1].createdAt,
                  )) &&
                  formatter.dateTime(ev.createdAt)}
              </div>
              <div className="text-base text-base-content/70">
                {formatter.dateTime(ev.createdAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div>{eventLabel(ev)}</div>
            </div>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center min-h-10">
          <span className="loading loading-spinner" />
        </div>
      )}
    </fieldset>
  );
}

export default function Dashboard() {
  const { data, isPending } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const { data } = await api.dashboard.stats.get();
      return data;
    },
  });

  const fmt = useFormatter();
  const thisYear = new Date().getFullYear();

  return (
    <main className="flex flex-col mx-auto max-w-7xl border border-base-200 w-full p-4">
      <h1 className="flex items-center gap-4 font-bold text-3xl">
        <PresentationChartBarIcon className="size-6 text-primary-content" />
        Dashboard
      </h1>

      {!isPending && (
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total revenue</div>
            <div className="stat-value">
              {fmt.number(data?.totalRevenue ?? 0, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              <span className="text-sm align-top">₫</span>
            </div>
            <div className="stat-desc">Jan 1st - Dec 31 {thisYear}</div>
          </div>

          <div className="stat">
            <div className="stat-title">Total members</div>
            <div className="stat-value">{data?.totalMembers ?? 0}</div>
            <div className="stat-desc">
              ↗︎ {data?.memberIncrease.value ?? 0} (
              {data?.memberIncrease.percentage ?? "N/A"}%)
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Total staff</div>
            <div className="stat-value">{data?.totalStaff ?? 0}</div>
            <div className="stat-desc">
              ↗︎ {data?.staffIncrease.value ?? 0} (
              {data?.staffIncrease.percentage ?? "N/A"}%)
            </div>
          </div>
        </div>
      )}

      <RecentActivity />
    </main>
  );
}
