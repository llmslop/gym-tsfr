"use client";

import {
  CheckIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { api } from "@/lib/eden";
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

  const [offset, setOffset] = useState(0);
  const [createKey, setCreateKey] = useState(0);
  const limit = 5;

  const { data: equipments, isPending } = useQuery({
    queryKey: ["rooms", roomId, "equipments", { offset, limit }],
    queryFn: async () => {
      if (roomId === undefined) return { data: [], hasMore: false };
      const res = await api
        .rooms({ id: roomId })
        .equipments.list.get({ query: { offset, limit } });
      return res.data;
    },
    placeholderData: (data) => data,
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
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => {
              // HACK: force remount to reset form state
              setCreateKey((k) => k + 1);
              createDialogRef.current?.showModal();
            }}
            className="btn btn-primary font-bold"
          >
            <PlusIcon className="size-4" />
            Create new
          </button>

          <div className="flex items-center gap-4">
            Page {Math.floor(offset / limit) + 1}
            <div className="join">
              <button
                className="btn btn-primary join-item"
                onClick={() => {
                  setOffset((o) => Math.max(0, o - limit));
                }}
                disabled={offset === 0}
              >
                {"<"}
              </button>
              <button
                className="btn btn-primary join-item"
                onClick={() => {
                  setOffset((o) => o + limit);
                }}
                disabled={!equipments?.hasMore}
              >
                {">"}
              </button>
            </div>
          </div>

          <dialog ref={createDialogRef} className="modal">
            <CreateEquipmentForm
              key={createKey}
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
                {(equipments?.data?.length ?? 0) > 0 ? (
                  (equipments?.data ?? []).map((equipment) => (
                    <tr
                      key={`equipment-${equipment._id}`}
                      className="hover:bg-base-300"
                    >
                      <th>{equipment.name}</th>
                      <td>{equipment.quantity}</td>
                      <td>{format.dateTime(equipment.createdAt, {})}</td>
                      <td>{equipment.origin}</td>
                      <td>
                        {equipment.warrantyUntil !== undefined &&
                        equipment.warrantyUntil !== null
                          ? format.dateTime(equipment.warrantyUntil, {})
                          : "-"}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center font-bold h-20">
                      No equipments found.
                    </td>
                  </tr>
                )}
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
