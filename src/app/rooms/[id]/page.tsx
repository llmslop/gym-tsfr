"use client";

import { use, useRef } from "react";
import { api } from "@/lib/eden";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { UpdateRoomForm } from "@/components/rooms/UpdateRoomForm";
import { DeleteRoomForm } from "@/components/rooms/DeleteRoomForm";
import { authClient } from "@/lib/auth-client";
import { EquipmentList } from "./equipments";

export default function RoomPage(props: { params: Promise<{ id: string }> }) {
  const session = authClient.useSession();
  const router = useRouter();
  const formatter = useFormatter();
  const updateDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const t = useTranslations("Room");

  const params = use(props.params);
  const { id } = params;

  const {
    data: room,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const res = await api.rooms({ id }).get();
      if (res.status === 200) return res.data;
      if (res.status === 404) return null;
    },
  });

  if (isPending)
    return (
      <main className="flex flex-col items-center justify-center">
        {" "}
        <span className="loading loading-spinner"></span>{" "}
      </main>
    );

  if (isError)
    return (
      <main className="flex flex-col justify-center items-center gap-8">
        <h1 className="font-bold text-5xl">An error occured</h1>
        <Link href="/rooms" className="btn btn-primary">
          Go back to room list
        </Link>
      </main>
    );

  if (room === null || room === undefined)
    return (
      <main className="flex flex-col justify-center items-center gap-8">
        <h1 className="font-bold text-5xl">Room not found</h1>
        <Link href="/rooms" className="btn btn-primary">
          Go back to room list
        </Link>
      </main>
    );

  return (
    <main className="flex flex-col items-center">
      <section className="w-full max-w-4xl px-2 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl">
              <span className="font-medium text-base-content/50">
                {room.roomId}
              </span>
              <span className="font-bold ml-4">{room.name}</span>
            </h1>
            <p>
              <span className="font-bold">{t(`roomTypes.${room.type}`)}</span> —{" "}
              {room.isActive ? (
                <span>Currently Active</span>
              ) : (
                <span>Currently Inactive</span>
              )}
            </p>
            <p className="text-xs text-base-content/50">
              Created at: {formatter.dateTime(room.createdAt)} — Last update:{" "}
              {formatter.dateTime(room.updatedAt)}
            </p>
          </div>
          <div className="join">
            <button
              className="btn btn-accent join-item"
              onClick={() => {
                updateDialogRef.current?.showModal();
              }}
            >
              <PencilSquareIcon className="size-4" />
            </button>
            <button
              className="btn btn-error join-item"
              onClick={() => {
                deleteDialogRef.current?.showModal();
              }}
            >
              <TrashIcon className="size-4" />
            </button>

            <dialog ref={updateDialogRef} className="modal">
              <UpdateRoomForm
                room={room}
                onSuccess={() => {
                  updateDialogRef.current?.close();
                }}
              />
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
            <dialog ref={deleteDialogRef} className="modal">
              <DeleteRoomForm
                room={room}
                onClose={() => {
                  deleteDialogRef.current?.close();
                }}
                onDelete={() => {
                  router.push("/rooms");
                }}
              />
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>
          </div>
        </div>
      </section>
      <div className="divider"></div>

      <section
        className="w-full max-w-6xl px-2 py-2 tabs tabs-lift"
        role="tablist"
      >
        <input
          type="radio"
          name="room_details_tab"
          className="tab"
          aria-label="Equipments"
          defaultChecked
        />
        <div className="tab-content border-base-300 bg-base-100 p-10">
          <EquipmentList roomId={room._id} />
        </div>

        <input
          type="radio"
          name="room_details_tab"
          className="tab"
          aria-label="Assigned staff"
          // TODO; proper role system
          disabled={session.data?.user?.role !== "admin"}
        />
        <div className="tab-content border-base-300 bg-base-100 p-10">
          Tab content 2
        </div>
      </section>
    </main>
  );
}
