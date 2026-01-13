"use client";

import { PresentationChartBarIcon } from "@heroicons/react/24/solid";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Event, EventWithDetails } from "@/lib/event";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
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
        query: {
          offset: 0,
          limit: 20,
        },
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
      if (data === "reload")
        queryClient.invalidateQueries({ queryKey: ["events"] });
    });
    return () => {
      ws.close();
    };
  }, [queryClient]);

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full max-w-7xl">
      <legend className="fieldset-legend">Recent activities</legend>
      {events ? (
        <ul className="grid grid-cols-[auto_auto_1fr] bg-base-200 p-2 text-lg">
          {events.events.map((ev, idx) => (
            <div
              key={`workout-log-event-${idx}`}
              className="hover:bg-base-300 grid grid-cols-subgrid col-start-1 -col-end-1 p-2 gap-2 items-baseline"
            >
              <div
                key={`event-date-${idx}`}
                className="text-base text-base-content/70"
              >
                {(idx == 0 ||
                  !dateEquals(
                    ev.createdAt,
                    events.events[idx - 1].createdAt,
                  )) &&
                  formatter.dateTime(ev.createdAt)}
              </div>
              <div
                key={`event-time-${idx}`}
                className="text-base text-base-content/70"
              >
                {formatter.dateTime(ev.createdAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div key={`event-label-${idx}`}>{eventLabel(ev)}</div>
            </div>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center min-h-10">
          <span className="loading loading-spinner"></span>
        </div>
      )}
    </fieldset>
  );
}

export default function Dashboard() {
  const t = useTranslations("HomePage");
  return (
    <main className="flex flex-col mx-auto max-w-7xl border border-base-200 w-full p-4">
      <h1 className="flex items-center gap-4 font-bold text-3xl">
        <PresentationChartBarIcon className="size-6 text-primary-content" />
        Dashboard
      </h1>

      <RecentActivity />
    </main>
  );
}
