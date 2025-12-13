import { api } from "@/lib/eden";
import { roomTypes, RoomWithId } from "@/lib/gym/room";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export function UpdateRoomForm({
  room,
  onSuccess,
}: {
  room?: RoomWithId;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Room");

  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(roomTypes),
    isActive: z.boolean(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: room?.name ?? "",
      type: room?.type ?? "gym",
      isActive: room?.isActive ?? true,
    },
  });

  const queryClient = useQueryClient();

  const {
    mutate: updateRoom,
    isPending,
    error,
  } = useMutation({
    async mutationFn({ name, type, isActive }: z.infer<typeof schema>) {
      const res = await api.rooms.update({ id: room!._id.toString() }).patch({
        name,
        type,
        isActive,
      });
      if (res.status === 200) {
        return;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onSuccess?.();
    },
  });

  if (!room) return null;

  return (
    <form
      className="modal-box w-auto flex flex-col items-center"
      onSubmit={handleSubmit((values) => updateRoom(values))}
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Update room</legend>

        {error && (
          <span className="text-error text-center mb-2">{error.message}</span>
        )}

        <label className="label" htmlFor="roomform-name">
          Name
        </label>
        <input
          id="roomform-name"
          className="input input-border"
          type="text"
          {...register("name")}
        />
        {errors.name && <p className="text-error">{errors.name.message}</p>}

        <label className="label" htmlFor="roomform-type">
          Type
        </label>
        <select id="roomform-type" className="select" {...register("type")}>
          <option disabled={true}>Pick the corresponding room type</option>

          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {t(`roomTypes.${type}`)}
            </option>
          ))}
        </select>

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
