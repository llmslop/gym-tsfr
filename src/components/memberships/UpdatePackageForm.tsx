"use client";

import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/eden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackageWithId, packageDurations } from "@/lib/gym/package";
import { useToast } from "../toast-context";
import { availableFeatures, featureCategories } from "@/lib/gym/features";

const packageSchema = z.object({
  price: z.number().min(0, "Price must be positive"),
  isActive: z.boolean(),
  features: z.array(z.string()).min(1, "Select at least one feature"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface UpdatePackageFormProps {
  package: PackageWithId;
  onSuccess: () => void;
}

export default function UpdatePackageForm({ 
  package: pkg, 
  onSuccess 
}: UpdatePackageFormProps) {
  const t = useTranslations("PackageManagement");
  const tMembership = useTranslations("Membership");
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      price: pkg.price,
      isActive: pkg.isActive,
      features: pkg.features,
    },
  });

  const selectedFeatures = watch("features") || [];

  const updateMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const res = await api.packages({ id: pkg._id }).patch({
        price: data.price,
        isActive: data.isActive,
        features: data.features,
      });

      if (res.status !== 200) {
        const errorMsg = (res as { error?: { value?: { message?: string } } }).error?.value?.message || "Failed to update package";
        throw new Error(errorMsg);
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ message: t("updateSuccess"), type: "success" });
      onSuccess();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("updateError");
      toast({ message: errorMessage, type: "error" });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    updateMutation.mutate(data);
  };

  const toggleFeature = (feature: string) => {
    const current = selectedFeatures;
    if (current.includes(feature)) {
      setValue("features", current.filter((f) => f !== feature));
    } else {
      setValue("features", [...current, feature]);
    }
  };

  const categoryLabels: Record<keyof typeof featureCategories, string> = {
    access: "Access & Equipment",
    facilities: "Facilities",
    training: "Training Sessions",
    benefits: "Additional Benefits",
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Duration (Read-only) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("duration")}</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={tMembership(`durations.${pkg.duration}`)}
              disabled
            />
          </div>

          {/* Price */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("price")}</span>
            </label>
            <input
              type="number"
              placeholder="500000"
              className={`input input-bordered ${errors.price ? "input-error" : ""}`}
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.price.message}
                </span>
              </label>
            )}
          </div>

          {/* Features - Checkbox List */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("features")}</span>
              <span className="label-text-alt">
                {selectedFeatures.length} selected
              </span>
            </label>
            
            <div className="space-y-4 max-h-96 overflow-y-auto border border-base-300 rounded-lg p-4">
              {Object.entries(featureCategories).map(([category, features]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-semibold text-sm text-base-content/70">
                    {categoryLabels[category as keyof typeof featureCategories]}
                  </h4>
                  <div className="space-y-1 pl-2">
                    {features.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={selectedFeatures.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                        />
                        <span className="text-sm">
                          {tMembership(`features.${feature}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {errors.features && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.features.message}
                </span>
              </label>
            )}
          </div>

          {/* Active Status */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                {...register("isActive")}
              />
              <span className="label-text">{t("isActive")}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSuccess}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {t("updating")}
                </>
              ) : (
                t("update")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
