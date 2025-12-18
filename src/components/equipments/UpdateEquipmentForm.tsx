import { api } from "@/lib/eden";
import { EquipmentWithId } from "@/lib/gym/equipment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useToast } from "../toast-context";

export function UpdateEquipmentForm({
  roomId,
  equipment,
  onSuccess,
}: {
  roomId: string;
  equipment?: EquipmentWithId;
  onSuccess?: () => void;
}) {
  const schema = z.intersection(
    z.object({
      name: z.string().min(1, "Name is required"),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
      origin: z.string().min(1, "Origin is required"),
      isActive: z.boolean(),
    }),
    z.union([
      z.object({ hasWarranty: z.literal(true), warrantyUntil: z.iso.date() }),
      z.object({
        hasWarranty: z.literal(false),
        warrantyUntil: z.any().optional(),
      }),
    ]),
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: equipment?.name ?? "",
      quantity: equipment?.quantity ?? 1,
      origin: equipment?.origin ?? "",
      hasWarranty:
        equipment?.warrantyUntil !== undefined &&
        equipment?.warrantyUntil !== null,
      warrantyUntil: equipment?.warrantyUntil?.toISOString()?.slice(0, 10),
      isActive: equipment?.isActive ?? false,
    },
  });

  const queryClient = useQueryClient();

  const hasWarranty = useWatch({ control, name: "hasWarranty" });
  const toast = useToast();

  const {
    mutate: updateEquipment,
    isPending,
    error,
  } = useMutation({
    async mutationFn({
      name,
      quantity,
      origin,
      hasWarranty,
      warrantyUntil,
      isActive,
    }: z.infer<typeof schema>) {
      const res = await api
        .rooms({ id: roomId })
        .equipments({ equipmentId: equipment!._id.toString() })
        .update.patch({
          name,
          quantity,
          origin,
          warrantyUntil: hasWarranty ? warrantyUntil : undefined,
          isActive,
        });
      if (res.status === 200) {
        return;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rooms", roomId, "equipments"],
      });
      onSuccess?.();
      toast({ type: "success", message: "Equipment updated" });
    },
    onError(err) {
      toast({ type: "error", message: err.message });
    },
  });

  if (!equipment) return null;

  return (
    <form
      className="modal-box w-auto flex flex-col items-center"
      onSubmit={handleSubmit((values) => updateEquipment(values))}
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Update equipment</legend>

        {error && (
          <span className="text-error text-center mb-2">{error.message}</span>
        )}

        <label className="label" htmlFor="equipmentform-name">
          Name
        </label>
        <input
          id="equipmentform-name"
          className="input input-border"
          type="text"
          {...register("name")}
        />
        {errors.name && <p className="text-error">{errors.name.message}</p>}

        <label className="label" htmlFor="equipmentform-type">
          Quantity
        </label>
        <input
          type="number"
          className="input validator"
          id="equipmentform-type"
          {...register("quantity")}
        />
        {errors.quantity && (
          <p className="text-error">{errors.quantity.message}</p>
        )}

        <label className="label" htmlFor="equipmentform-origin">
          Country of origin
        </label>
        <input
          id="equipmentform-origin"
          className="input input-border"
          type="text"
          {...register("origin")}
        />
        {errors.origin && <p className="text-error">{errors.origin.message}</p>}

        <label className="label" htmlFor="equipmentform-warranty">
          <input
            type="checkbox"
            className="checkbox"
            {...register("hasWarranty")}
          />
          Has warranty until
        </label>
        <input
          id="equipmentform-warranty"
          className={`input input-border ${hasWarranty ? "" : "hidden"}`}
          type="date"
          {...register("warrantyUntil")}
        />
        {errors.warrantyUntil && (
          <p className="text-error">{errors.warrantyUntil.message}</p>
        )}

        <label className="label my-2">
          <input
            type="checkbox"
            className="checkbox"
            {...register("isActive")}
          />
          Currently active
        </label>

        <button className="btn btn-primary" type="submit" disabled={isPending}>
          Update
        </button>
      </fieldset>
    </form>
  );
}
