"use client";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/eden";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

export default function FeedbacksPage() {
  const limit = 5;
  const t = useTranslations("Feedbacks");
  const { data: feedbacks } = useQuery({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const res = await api.feedbacks.list.get({
        query: { offset: 0, limit },
      });
      return res.data ?? { data: [], hasMore: false };
    },
  });

  const formatter = useFormatter();
  const session = authClient.useSession();
  const { data: hasCreatePerm, isPending } = useQuery({
    queryKey: ["currentUserPerm", session?.data?.user?.id],
    queryFn: async () => {
      if (!session.data) return false;
      const { data } = await authClient.admin.hasPermission({
        permission: { feedbacks: ["create"] }
      });
      console.debug(data);
      return data?.success ?? false;
    }
  });

  return (
    <main className="flex flex-col items-center w-full p-4">
      <div className="card shadow xl bg-base 100 w-full max-w-7xl flex flex-col items-center p-4">
        <div className="w-full flex items-center justify-between mb-4">
          <h1 className="flex items-center font-bold text-3xl mb-4">
            <ChatBubbleLeftRightIcon className="size-8 mr-2 text-primary" />
            {t("title")}
          </h1>

          <div className="flex items-center justify-end mb-4">
            {!isPending && hasCreatePerm && < Link href="/feedbacks/new" className="btn btn-primary font-bold">
              <PlusIcon className="size-4" />
              {t("createNew")}
            </Link>}
          </div>
        </div>

        {feedbacks !== undefined ? (
          <ul className="list bg-base-100 rounded-box shadow-md w-full">
            {feedbacks.data.map((feedback, index) => (
              <li
                className="list-row hover:bg-base-200"
                key={`feedback-${index}`}
              >
                <div className="flex flex-col items-center text-sm font-thin tabular-nums">
                  <p>{formatter.dateTime(feedback.createdAt)}</p>
                  <p>
                    {formatter.dateTime(feedback.createdAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
                <div
                  className={[
                    "avatar avatar-online",
                    feedback.author.image === undefined
                      ? "avatar-placeholder"
                      : "",
                  ].join(" ")}
                >
                  <div className="ring-primary ring-offset-base-100 w-12 rounded-full ring-2 ring-offset-2 inline">
                    {feedback.author.image ? (
                      <img
                        src={feedback.author.image}
                        alt="User avatar"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="font-bold text-xl text-center align-middle w-full">
                        {feedback.author.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="list-col-grow">
                  <div className="text-lg">
                    {feedback.title ?? t("noTitle")}
                  </div>
                  <div className="text-sm uppercase font-semibold opacity-60">
                    From {feedback.author.name}
                  </div>
                </div>
                <Link
                  href={`/feedbacks/${feedback._id.toString()}`}
                  className="btn btn-ghost"
                >
                  View thread
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <span className="loading loading-spinner"></span>
        )}
      </div>
    </main >
  );
}
