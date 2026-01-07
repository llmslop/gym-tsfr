"use client";

import { useForm, useFieldArray } from "react-hook-form";
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

type CompleteSessionFormData = {
  trainerNotes: string;
  exercises: Exercise[];
};

export default function CompleteSessionForm({
  sessionId,
  initialExercises,
  onSuccess,
}: {
  sessionId: string;
  initialExercises: Exercise[];
  onSuccess?: () => void;
}) {
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompleteSessionFormData>({
    defaultValues: {
      trainerNotes: "",
      exercises: initialExercises,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "exercises",
  });

  const mutation = useMutation({
    mutationFn: async (data: CompleteSessionFormData) => {
      const response = await api.trainers.sessions({ id: sessionId }).complete.post(
        data
      );
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
    onSuccess: () => {
      toast({ message: "Session completed successfully!", type: "success" });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const onSubmit = (data: CompleteSessionFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Trainer Notes */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Session Summary & Notes</span>
        </label>
        <textarea
          {...register("trainerNotes", {
            required: "Please provide session notes",
          })}
          className="textarea textarea-bordered h-32"
          placeholder="How did the session go? Any observations or recommendations?"
        />
        {errors.trainerNotes && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.trainerNotes.message}
            </span>
          </label>
        )}
      </div>

      {/* Exercises (update actual performance) */}
      <div className="space-y-4">
        <label className="label">
          <span className="label-text font-semibold">
            Exercise Performance (Update actual performance)
          </span>
        </label>

        {fields.map((field, index) => (
          <div key={field.id} className="card bg-base-200 p-4">
            <div className="font-semibold mb-2">
              {initialExercises[index].name}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sets Completed</span>
                </label>
                <input
                  type="number"
                  {...register(`exercises.${index}.sets`, {
                    required: "Required",
                    min: 0,
                  })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Reps Completed</span>
                </label>
                <input
                  type="number"
                  {...register(`exercises.${index}.reps`, {
                    required: "Required",
                    min: 0,
                  })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Weight Used (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`exercises.${index}.weight`)}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <input
                  {...register(`exercises.${index}.notes`)}
                  className="input input-bordered"
                  placeholder="Form issues, difficulty, etc."
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
            "Complete Session"
          )}
        </button>
      </div>
    </form>
  );
}
