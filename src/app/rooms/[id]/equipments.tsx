"use client";

import {
  CheckIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { roomTypes, RoomWithId } from "@/lib/gym/room";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/eden";
import { useRouter } from "@/i18n/navigation";
import { DeleteRoomForm } from "@/components/rooms/DeleteRoomForm";
import { UpdateRoomForm } from "@/components/rooms/UpdateRoomForm";
import { EquipmentWithId } from "@/lib/gym/equipment";
import { CreateEquipmentForm } from "@/components/equipments/CreateEquipmentForm";
import { UpdateEquipmentForm } from "@/components/equipments/UpdateEquipmentForm";
import { DeleteEquipmentForm } from "@/components/equipments/DeleteEquipmentForm";

export function EquipmentList({ roomId }: { roomId: string }) {
  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const updateDialogRef = useRef<HTMLDialogElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const t = useTranslations("Equipment");
  const format = useFormatter();

  const { data: rooms, isPending } = useQuery({
    queryKey: ["rooms", roomId, "equipments"],
    queryFn: async () => {
      if (roomId === undefined) return [];
      const res = await api
        .rooms({ id: roomId })
        .equipments.list.get({ offset: 0, limit: 20 });
      return res.data ?? [];
    },
  });

  const [equipmentToUpdate, setEquipmentToUpdate] = useState<
    EquipmentWithId | undefined
  >(undefined);
  const [equipmentToDelete, setEquipmentToDelete] = useState<
    EquipmentWithId | undefined
  >(undefined);

  return (
    <section className="flex flex-col items-center w-full p-4">
      <div className="w-full max-w-7xl flex flex-col items-center">
        <div className="w-full flex items-center justify-end mb-4">
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
            <CreateEquipmentForm
              roomId={roomId}
              close={() => createDialogRef.current?.close()}
            />
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </div>

        {isPending ? (
          <span className="loading loading-spinner"></span>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Import date</th>
                  <th>Country of origin</th>
                  <th>Warranty until</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(rooms ?? []).map((equipment) => (
                  <tr
                    key={`equipment-${equipment._id}`}
                    className="hover:bg-base-300"
                  >
                    <th>{equipment.name}</th>
                    <td>{equipment.quantity}</td>
                    <td>{format.dateTime(equipment.createdAt, {})}</td>
                    <td>{equipment.origin}</td>
                    <td>
                      {equipment.warrantyUntil !== undefined
                        ? format.dateTime(equipment.warrantyUntil, {})
                        : "Unknown"}
                    </td>
                    <td>
                      {equipment.isActive ? (
                        <CheckIcon className="size-4" />
                      ) : (
                        <XMarkIcon className="size-4" />
                      )}
                    </td>
                    <td className="join">
                      <button
                        className="btn btn-accent join-item"
                        onClick={() => {
                          setEquipmentToUpdate(equipment);
                          updateDialogRef.current?.showModal();
                        }}
                      >
                        <PencilSquareIcon className="size-4" />
                      </button>
                      <button
                        className="btn btn-error join-item"
                        onClick={() => {
                          setEquipmentToDelete(equipment);
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
        <UpdateEquipmentForm
          roomId={roomId}
          equipment={equipmentToUpdate}
          key={equipmentToUpdate?._id}
          onSuccess={() => {
            updateDialogRef.current?.close();
            setEquipmentToUpdate(undefined);
          }}
        />
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog ref={deleteDialogRef} className="modal">
        <DeleteEquipmentForm
          roomId={roomId}
          equipment={equipmentToDelete}
          onClose={() => {
            deleteDialogRef.current?.close();
            setEquipmentToDelete(undefined);
          }}
        />
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </section>
  );
}
