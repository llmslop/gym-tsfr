"use client";

import {
  CheckIcon,
  InformationCircleIcon,
  ListBulletIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { roomTypes, RoomWithId } from "@/lib/gym/room";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/eden";
import { useRouter } from "@/i18n/navigation";
import { DeleteRoomForm } from "@/components/rooms/DeleteRoomForm";
import { UpdateRoomForm } from "@/components/rooms/UpdateRoomForm";

function CreateRoomForm() {
  const t = useTranslations("Room");
  const router = useRouter();

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
      type: "gym",
      isActive: true,
    },
  });

  const queryClient = useQueryClient();

  const {
    mutate: createRoom,
    isPending,
    error,
  } = useMutation({
    async mutationFn({ name, type, isActive }: z.infer<typeof schema>) {
      const res = await api.rooms.create.post({
        name,
        type,
        isActive,
      });
      if (res.status === 200) {
        return res.data?.docId;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess(docId) {
      router.push(`/rooms/${docId}`);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return (
    <form
      className="modal-box w-auto flex flex-col items-center"
      onSubmit={handleSubmit((values) => createRoom(values))}
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Create new room</legend>

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
          Create
        </button>
      </fieldset>
    </form>
  );
}

export default function RoomsPage() {
  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const updateDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const t = useTranslations("Room");

  const { data: rooms, isPending } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.rooms.list.get();
      return res.data ?? [];
    },
  });

  const [roomToUpdate, setRoomToUpdate] = useState<RoomWithId | undefined>(
    undefined,
  );
  const [roomToDelete, setRoomToDelete] = useState<RoomWithId | undefined>(
    undefined,
  );

  return (
    <main className="flex flex-col items-center w-full p-4">
      <div className="card shadow-xl bg-base-200 w-full max-w-7xl flex flex-col items-center p-4">
        <div className="w-full flex items-center justify-between mb-4">
          <h1 className="flex items-center font-bold text-3xl mb-4">
            <ListBulletIcon className="size-8 mr-2 text-primary" />
            Managed rooms
          </h1>

          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => {
                createDialogRef.current?.showModal();
              }}
              className="btn btn-primary font-bold"
            >
              <PlusIcon className="size-4" />
              Create new
            </button>

            <dialog ref={createDialogRef} className="modal">
              <CreateRoomForm />
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        </div>

        {isPending ? (
          <span className="loading loading-spinner"></span>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Room type</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(rooms ?? []).map((room) => (
                  <tr key={`room-${room._id}`} className="hover:bg-base-300">
                    <th>{room.roomId}</th>
                    <td>{room.name}</td>
                    <td>{t(`roomTypes.${room.type}`)}</td>
                    <td>
                      {room.isActive ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <XMarkIcon className="size-4" />
                      )}
                    </td>
                    <td className="join">
                      <a
                        href={`/rooms/${room._id}`}
                        className="btn btn-info join-item"
                      >
                        <InformationCircleIcon className="size-4" />
                      </a>
                      <button
                        className="btn btn-accent join-item"
                        onClick={() => {
                          setRoomToUpdate(room);
                          updateDialogRef.current?.showModal();
                        }}
                      >
                        <PencilSquareIcon className="size-4" />
                      </button>
                      <button
                        className="btn btn-error join-item"
                        onClick={() => {
                          setRoomToDelete(room);
                          deleteDialogRef.current?.showModal();
                        }}
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <dialog ref={updateDialogRef} className="modal">
        <UpdateRoomForm
          room={roomToUpdate}
          key={roomToUpdate?._id}
          onSuccess={() => {
            updateDialogRef.current?.close();
            setRoomToUpdate(undefined);
          }}
        />
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog ref={deleteDialogRef} className="modal">
        <DeleteRoomForm
          room={roomToDelete}
          onClose={() => {
            deleteDialogRef.current?.close();
            setRoomToDelete(undefined);
          }}
        />
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </main>
  );
}
