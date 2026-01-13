"use client";

import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { useToast } from "@/components/toast-context";
import { useEffect } from "react";

type TrainerProfileFormData = {
  specialization: string[];
  bio: string;
  certifications: string[];
  yearsOfExperience: number;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  maxClients: number;
  isActive: boolean;
};

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const SPECIALIZATIONS = [
  "Weight Loss",
  "Muscle Building",
  "Athletic Performance",
  "Rehabilitation",
  "Yoga",
  "Cardio",
  "Strength Training",
  "Nutrition",
  "CrossFit",
  "Powerlifting",
];

const CERTIFICATIONS_PLACEHOLDER = "NASM-CPT, ISSA Certified, ACE Certified";

export default function TrainerProfileForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const toast = useToast();
  const t = useTranslations("Trainers.trainerProfile");
  const daysOfWeek = useDaysOfWeek();

  // Fetch existing profile
  const { data: profile } = useQuery({
    queryKey: ["trainer-profile", "me"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const response = await api.trainers.profile.me.get();
      if (response.error) {
        const status = (response.error as { status?: number }).status;
        const value = (response.error as { value?: string | { message?: string } }).value;
        if (status === 404) return null;
        const message =
          typeof value === "string"
            ? value
            : value && typeof value === "object" && "message" in value
              ? String(value.message)
              : "Failed to load trainer profile";
        throw new Error(message);
      }
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm<TrainerProfileFormData>({
    defaultValues: {
      specialization: [],
      bio: "",
      certifications: [],
      yearsOfExperience: 0,
      availability: [],
      maxClients: 10,
      isActive: true,
    },
  });

  // Reset form with fetched profile data
  useEffect(() => {
    if (profile && 'specialization' in profile) {
      reset(profile);
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: async (data: TrainerProfileFormData) => {
      const response = await api.trainers.profile.post(data);
      if (response.error) {
        const value = (response.error as { value?: string | { message?: string } }).value;
        const message =
          typeof value === "string"
            ? value
            : value && typeof value === "object" && "message" in value
              ? String(value.message)
              : "Failed to save trainer profile";
        throw new Error(message);
      }
      return response.data;
    },
    onSuccess: () => {
      toast({ message: "Profile saved successfully", type: "success" });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({ message: error.message, type: "error" });
    },
  });

  const onSubmit = (data: TrainerProfileFormData) => {
    mutation.mutate({
      ...data,
      yearsOfExperience: Number(data.yearsOfExperience),
      maxClients: Number(data.maxClients),
      availability: data.availability ?? [],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Specialization */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-base-content">Specializations</h3>
        <p className="text-sm text-base-content/70">Select your areas of expertise</p>
        <Controller
          name="specialization"
          control={control}
          rules={{ required: t("specializationRequired") }}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              {SPECIALIZATIONS.map((spec) => (
                <label key={spec} className="flex items-center justify-between p-3 rounded-lg border border-base-300 hover:border-primary cursor-pointer transition-colors">
                  <span className="font-medium">{spec}</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={field.value.includes(spec)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        field.onChange([...field.value, spec]);
                      } else {
                        field.onChange(
                          field.value.filter((s) => s !== spec)
                        );
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          )}
        />
        {errors.specialization && (
          <p className="text-sm text-error mt-2">
            {errors.specialization.message}
          </p>
        )}
      </div>

      <div className="divider"></div>

      {/* Bio */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-base-content">Bio</h3>
        <p className="text-sm text-base-content/70">Tell members about yourself and your training philosophy</p>
        <textarea
          {...register("bio", { required: t("bioRequired") })}
          className="textarea textarea-bordered w-full h-32 text-base"
          placeholder={t("bioPlaceholder")}
        />
        {errors.bio && (
          <p className="text-sm text-error mt-2">
            {errors.bio.message}
          </p>
        )}
      </div>

      <div className="divider"></div>

      {/* Certifications */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-base-content">Certifications</h3>
        <p className="text-sm text-base-content/70">List your professional certifications (one per line)</p>
        <Controller
          name="certifications"
          control={control}
          rules={{ required: t("certificationsRequired") }}
          render={({ field }) => (
            <textarea
              className="textarea textarea-bordered w-full h-32 text-base"
              placeholder={CERTIFICATIONS_PLACEHOLDER}
              value={field.value.join("\n")}
              onChange={(e) =>
                field.onChange(
                  e.target.value.split("\n").filter((c) => c.trim())
                )
              }
            />
          )}
        />
        {errors.certifications && (
          <p className="text-sm text-error mt-2">
            {errors.certifications.message}
          </p>
        )}
      </div>

      <div className="divider"></div>

      {/* Experience and Settings */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-base-content">Professional Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Years of Experience */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base">Years of Experience</span>
            </label>
            <input
              type="number"
              {...register("yearsOfExperience", {
                required: t("experienceRequired"),
                min: { value: 0, message: "Must be 0 or greater" },
                valueAsNumber: true,
              })}
              className="input input-bordered text-base"
              placeholder="e.g., 5"
            />
            {errors.yearsOfExperience && (
              <p className="text-sm text-error mt-2">
                {errors.yearsOfExperience.message}
              </p>
            )}
          </div>

          {/* Max Clients */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base">Maximum Clients</span>
            </label>
            <input
              type="number"
              {...register("maxClients", {
                required: "Required",
                min: { value: 1, message: "Must be at least 1" },
                valueAsNumber: true,
              })}
              className="input input-bordered text-base"
              placeholder="e.g., 10"
            />
            {errors.maxClients && (
              <p className="text-sm text-error mt-2">
                {errors.maxClients.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Active Status */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-base-content">Availability Status</h3>
        <label className="flex items-center justify-between p-4 rounded-lg border border-base-300 cursor-pointer hover:border-primary transition-colors">
          <div>
            <span className="font-semibold text-base">Active Status</span>
            <p className="text-sm text-base-content/70 mt-1">Enable this to accept new clients</p>
          </div>
          <input
            type="checkbox"
            {...register("isActive")}
            className="toggle toggle-primary toggle-lg"
          />
        </label>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full text-lg"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <span className="loading loading-spinner"></span>
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </form>
  );
}
