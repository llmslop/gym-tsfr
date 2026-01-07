"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/eden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackageWithId } from "@/lib/gym/package";
import { useToast } from "../toast-context";

interface DeletePackageFormProps {
  package: PackageWithId;
  onClose: () => void;
}

export default function DeletePackageForm({
  package: pkg,
  onClose,
}: DeletePackageFormProps) {
  const t = useTranslations("PackageManagement");
  const tMembership = useTranslations("Membership");
  const queryClient = useQueryClient();
  const toast = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.packages({ id: pkg._id }).delete();
      if (res.status !== 200) {
        const errorMsg = (res as any).error?.value?.message || "Failed to delete package";
        throw new Error(errorMsg);
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ message: t("deleteSuccess"), type: "success" });
      onClose();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("deleteError");
      toast({ message: errorMessage, type: "error" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h3 className="card-title text-error">{t("deleteTitle")}</h3>
        
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{t("deleteWarning")}</span>
        </div>

        <div className="space-y-2 my-4">
          <div className="flex justify-between">
            <span className="font-semibold">{t("duration")}:</span>
            <span>{tMembership(`durations.${pkg.duration}`)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("price")}:</span>
            <span>{formatPrice(pkg.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t("status")}:</span>
            <span className={pkg.isActive ? "text-success" : "text-error"}>
              {pkg.isActive ? t("active") : t("inactive")}
            </span>
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <span className="loading loading-spinner"></span>
                {t("deleting")}
              </>
            ) : (
              t("confirmDelete")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
