import { api } from "@/lib/eden";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useState } from "react";

export function CreateEquipmentForm({
  roomId,
  close,
}: {
  roomId: string;
  close?: () => void;
}) {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    origin: z.string().min(1, "Origin is required"),
    warrantyUntil: z.preprocess(
      (arg) => (arg === "" ? undefined : arg),
      z.iso.date().optional(),
    ),
    isActive: z.boolean(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
      isActive: false,
    },
  });

  const queryClient = useQueryClient();
  const [hasWarranty, setHasWarranty] = useState(false);

  const {
    mutate: createEquipment,
    isPending,
    error,
  } = useMutation({
    async mutationFn({
      name,
      quantity,
      origin,
      warrantyUntil,
      isActive,
    }: z.infer<typeof schema>) {
      const res = await api.rooms({ id: roomId }).equipments.add.post({
        name,
        quantity,
        origin,
        warrantyUntil,
        isActive,
      });
      if (res.status === 200) {
        return res.data?.docId;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess(docId) {
      queryClient.invalidateQueries({
        queryKey: ["rooms", roomId, "equipments"],
      });
      close?.();
      reset();
    },
  });

  return (
    <form
      className="modal-box w-auto flex flex-col items-center"
      onSubmit={handleSubmit((values) => createEquipment(values))}
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Add new equipment</legend>

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
          {...register("quantity", { valueAsNumber: true })}
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
            checked={hasWarranty}
            onChange={(event) => setHasWarranty(event.target.checked)}
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
          Add
        </button>
      </fieldset>
    </form>
  );
}
