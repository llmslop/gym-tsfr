"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
};

type SessionScheduleFormData = {
  assignmentId: string;
  sessionDate: string;
  duration: number;
  exercises: Exercise[];
};

export default function SessionScheduleForm({
  assignmentId,
  memberName,
  onSuccess,
}: {
  assignmentId: string;
  memberName: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Trainers.sessionSchedule");
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SessionScheduleFormData>({
    defaultValues: {
      assignmentId,
      sessionDate: "",
      duration: 60,
      exercises: [{ name: "", sets: 3, reps: 10 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "exercises",
  });

  const mutation = useMutation({
    mutationFn: async (data: SessionScheduleFormData) => {
      const response = await api.trainers.sessions.schedule.post(data);
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
    onSuccess: () => {
      toast({ message: "Session scheduled successfully!", type: "success" });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const onSubmit = (data: SessionScheduleFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="alert alert-info">
        <span>Scheduling session for: <strong>{memberName}</strong></span>
      </div>

      {/* Session Date & Time */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Session Date & Time</span>
        </label>
        <input
          type="datetime-local"
          {...register("sessionDate", { required: t("dateRequired") })}
          className="input input-bordered"
        />
        {errors.sessionDate && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.sessionDate.message}
            </span>
          </label>
        )}
      </div>

      {/* Duration */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Duration (minutes)</span>
        </label>
        <input
          type="number"
          {...register("duration", { required: t("durationRequired"), min: 15 })}
          className="input input-bordered"
        />
        {errors.duration && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.duration.message}
            </span>
          </label>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="label">
            <span className="label-text font-semibold">Exercise Plan</span>
          </label>
          <button
            type="button"
            onClick={() => append({ name: "", sets: 3, reps: 10 })}
            className="btn btn-sm btn-outline"
          >
            + Add Exercise
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="card bg-base-200 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Exercise {index + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="btn btn-xs btn-error"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control col-span-2">
                <label className="label">
                  <span className="label-text">Exercise Name</span>
                </label>
                <input
                  {...register(`exercises.${index}.name`, {
                    required: t("exerciseNameRequired"),
                  })}
                  className="input input-bordered"
                  placeholder="e.g., Bench Press"
                />
                {errors.exercises?.[index]?.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.exercises[index]?.name?.message}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sets</span>
                </label>
                <input
                  type="number"
                  {...register(`exercises.${index}.sets`, {
                    required: t("setsRequired"),
                    min: 1,
                  })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Reps</span>
                </label>
                <input
                  type="number"
                  {...register(`exercises.${index}.reps`, {
                    required: t("repsRequired"),
                    min: 1,
                  })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Weight (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`exercises.${index}.weight`)}
                  className="input input-bordered"
                  placeholder={t("weightOptional")}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <input
                  {...register(`exercises.${index}.notes`)}
                  className="input input-bordered"
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="form-control">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            t("scheduleSession")
          )}
        </button>
      </div>
    </form>
  );
}
