"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";

type SessionFeedbackFormData = {
  memberFeedback: string;
  memberRating: number;
};

export default function SessionFeedbackForm({
  sessionId,
  trainerName,
  onSuccess,
}: {
  sessionId: string;
  trainerName: string;
  onSuccess?: () => void;
}) {
  const toast = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFeedbackFormData>({
    defaultValues: {
      memberFeedback: "",
      memberRating: 0,
    },
  });

  const rating = watch("memberRating");

  const mutation = useMutation({
    mutationFn: async (data: SessionFeedbackFormData) => {
      const response = await api.trainers.sessions({ id: sessionId }).feedback.post(
        data
      );
      if (response.error) throw new Error(response.error.value as unknown as string);
      return response.data;
    },
    onSuccess: () => {
      toast({ message: "Feedback submitted successfully!", type: "success" });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const onSubmit = (data: SessionFeedbackFormData) => {
    if (data.memberRating === 0) {
      toast({ message: "Please select a rating", type: "error" });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="alert alert-info">
        <span>
          Rate your session with <strong>{trainerName}</strong>
        </span>
      </div>

      {/* Rating */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Rating</span>
        </label>
        <div className="rating rating-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <input
              key={star}
              type="radio"
              {...register("memberRating", { required: "Rating is required" })}
              value={star}
              className="mask mask-star-2 bg-orange-400"
              onClick={() => setValue("memberRating", star)}
            />
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm mt-2 text-base-content/70">
            {rating === 5 && "Excellent!"}
            {rating === 4 && "Great!"}
            {rating === 3 && "Good"}
            {rating === 2 && "Fair"}
            {rating === 1 && "Needs Improvement"}
          </p>
        )}
        {errors.memberRating && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.memberRating.message}
            </span>
          </label>
        )}
      </div>

      {/* Feedback */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Your Feedback</span>
        </label>
        <textarea
          {...register("memberFeedback", {
            required: "Please provide feedback",
          })}
          className="textarea textarea-bordered h-32"
          placeholder="Share your experience with this training session..."
        />
        {errors.memberFeedback && (
          <label className="label">
            <span className="label-text-alt text-error">
              {errors.memberFeedback.message}
            </span>
          </label>
        )}
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
            "Submit Feedback"
          )}
        </button>
      </div>
    </form>
  );
}
