"use client";

import { useRouter } from "@/i18n/navigation";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";

import "react-quill-new/dist/quill.snow.css";
import { api } from "@/lib/eden";
import { useMutation } from "@tanstack/react-query";
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

export default function NewFeedbackPage() {
  const router = useRouter();

  const schema = z.object({
    title: z.string().min(5, "Title must have at least 5 characters"),
    body: z.string().min(20, "Body must have at least 20 characters"),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate: createFeedback, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const res = await api.feedbacks.new.post(data);
      if (res.status === 200) {
        return res.data?.docId;
      }

      throw new Error("Failed to create feedback");
    },
    onSuccess(data) {
      router.push(`/feedbacks/${data}`);
    },
  });

  return (
    <main className="flex flex-col items-center w-full p-4">
      <div className="card shadow xl bg-base-100 w-full max-w-7xl flex flex-col items-center p-4">
        <h1 className="w-full flex items-center justify-start font-bold text-3xl mb-4">
          <ChatBubbleLeftRightIcon className="size-8 mr-2 text-primary" />
          New feedback
        </h1>

        <form
          onSubmit={handleSubmit((values) => createFeedback(values))}
          className="flex flex-col w-full"
        >
          <input
            className="input w-full mb-2"
            type="text"
            placeholder="Enter feedback title here"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-error-content">{errors.title.message}</p>
          )}

          <div className="w-full">
            <Controller
              name="body"
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <ReactQuill theme="snow" value={value} onChange={onChange} />
                );
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary mt-4 m-auto"
            disabled={isPending}
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
