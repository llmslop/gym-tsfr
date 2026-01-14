import { api } from "@/lib/eden";
import { EquipmentWithId } from "@/lib/gym/equipment";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export function DeleteEquipmentForm({
  roomId,
  equipment,
  onClose: close,
  onDelete,
}: {
  roomId: string;
  equipment?: EquipmentWithId;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const queryClient = useQueryClient();
  const { mutate: deleteEquipment, isPending } = useMutation({
    async mutationFn(id: string) {
      const res = await api
        .rooms({ id: roomId })
        .equipments({ equipmentId: id })
        .delete();
      if (res.status === 200) {
        return;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rooms", roomId, "equipments"],
      });
      close();
    },
  });

  return (
    <div className="modal-box">
      <h1 className="font-bold mb-4">
        Are you sure you want to delete the equipment "{equipment?.name}"?
      </h1>
      <div className="flex gap-4 justify-center items-center">
        <button className="btn btn-ghost" onClick={close} disabled={isPending}>
          Cancel
        </button>
        <button
          className="btn btn-error"
          onClick={() => {
            if (equipment) {
              deleteEquipment(equipment._id.toString());
              onDelete?.();
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
