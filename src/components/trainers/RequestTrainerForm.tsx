"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";

type RequestTrainerFormData = {
  trainerId: string;
  notes: string;
};

export default function RequestTrainerForm({
  trainerId,
  trainerName,
  onSuccess,
}: {
  trainerId: string;
  trainerName: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Trainers.requestTrainer");
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestTrainerFormData>({
    defaultValues: {
      trainerId,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RequestTrainerFormData) => {
      const response = await api.trainers.request.post(data);
      if (response.error) {
        const value = (response.error as { value?: string | { message?: string }; status?: number }).value;
        const status = (response.error as { status?: number }).status;

        const message =
          typeof value === "string"
            ? value
            : value && typeof value === "object" && "message" in value
              ? String(value.message)
              : `Request failed${status ? ` (${status})` : ""}`;

        throw new Error(message);
      }
      return response.data;
    },
    onSuccess: () => {
      toast({ 
        message: "Trainer request sent! Waiting for trainer approval.", 
        type: "success" 
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const onSubmit = (data: RequestTrainerFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          You are requesting <strong>{trainerName}</strong> as your personal
          trainer
        </span>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Additional Notes (Optional)</span>
        </label>
        <textarea
          {...register("notes")}
          className="textarea textarea-bordered h-24"
          placeholder={t("notesPlaceholder")}
        />
      </div>

      <div className="form-control">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>
    </form>
  );
}
