"use client";

import { api } from "@/lib/eden";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter } from "next-intl";
import React, { useEffect } from "react";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Link } from "@/i18n/navigation";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useToast } from "@/components/toast-context";
import { authClient } from "@/lib/auth-client";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

export default function FeedbackThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const addReplySchema = z.object({
    title: z.string().min(5, "Title must have at least 5 characters"),
    body: z.string().min(20, "Body must have at least 20 characters"),
  });

  const id = React.use(params).id;
  const toast = useToast();
  const { data: thread, error } = useQuery({
    queryKey: ["feedbacks", id],
    queryFn: async () => {
      const res = await api.feedbacks({ id }).get();
      if (res.status === 200) return res.data;
      throw new Error(
        res.error?.value?.message ?? "Failed to load feedback thread",
      );
    },
  });

  const formatter = useFormatter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: zodResolver(addReplySchema),
  });

  const { mutate: addReply, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof addReplySchema>) => {
      const res = await api.feedbacks({ id }).reply.post(data);
      if (res.status === 200) return res.data;
      throw new Error(res.error?.value?.message ?? "Failed to add reply");
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["feedbacks", id] });
      // HACK: reset doesnt work for some reason
      setValue("title", "");
      setValue("body", "");
      // HACK: idk wtf is happening here tbh
      setTimeout(() => clearErrors(), 1);
    },
    onError(err) {
      toast({ type: "error", message: err.message });
    },
  });

  useEffect(() => {
    const ws = api.feedbacks({ id }).ws.subscribe();
    ws.subscribe(({ data }) => {
      if (data === "reload")
        queryClient.invalidateQueries({ queryKey: ["feedbacks", id] });
    });
    return () => {
      ws.close();
    };
  }, [id, queryClient]);

  const session = authClient.useSession();
  const { data: hasCreatePerm, isPending: isPendingPerm } = useQuery({
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
    <div className="w-full max-w-7xl mx-auto">
      {error && (
        <p className="text-error">
          Error loading feedback thread: {error.message}
        </p>
      )}
      <div className="flex gap-2 items-center m-4">
        <ArrowUturnLeftIcon className="size-4" />
        <Link className="link" href="/feedbacks/">
          Return to feedbacks page
        </Link>
      </div>
      {thread?.map((feedback, index) => (
        <div
          className="card shadow-xl bg-base-200 m-4 p-4 rounded-xl"
          key={`feedback-${index}`}
        >
          <div>
            <div className="flex gap-4 items-center">
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

              <div className="flex flex-col">
                <h1 className="font-bold text-xl">{feedback.author.name}</h1>
                <p className="text-base-content/60">
                  {formatter.dateTime(feedback.createdAt, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                  {+feedback.createdAt !== +feedback.updatedAt &&
                    ` -- Last edit: ${formatter.dateTime(feedback.updatedAt)}`}
                </p>
              </div>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            {feedback.title ?? "No title - Reol"}
          </h1>

          <div
            className="prose max-w-full wrap-break-word"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(feedback.body),
            }}
          />
        </div>
      ))}

      {!isPendingPerm && hasCreatePerm && <form
        onSubmit={handleSubmit((values) => addReply(values))}
        className="card shadow-xl bg-base-200 m-4 p-4 rounded-xl"
      >
        <h1 className="font-bold mb-2">Reply to the conversation</h1>

        <input
          type="text"
          className="input w-full"
          placeholder="Enter title here"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-error mt-2">{errors.title.message}</p>
        )}

        <Controller
          control={control}
          name="body"
          render={({ field: { value, onChange } }) => {
            return (
              <ReactQuill
                className="mt-4"
                theme="snow"
                value={value}
                onChange={onChange}
              />
            );
          }}
        />
        {errors.body && (
          <p className="text-error mt-2">{errors.body.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary ml-auto mt-2"
        >
          Submit
        </button>
      </form>}
    </div>
  );
}
