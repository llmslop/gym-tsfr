import { api } from "@/lib/eden";
import { RoomWithId } from "@/lib/gym/room";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export function DeleteRoomForm({
  room,
  onClose: close,
  onDelete,
}: {
  room?: RoomWithId;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const queryClient = useQueryClient();
  const { mutate: deleteRoom, isPending } = useMutation({
    async mutationFn(id: string) {
      const res = await api.rooms({ id }).delete();
      if (res.status === 200) {
        return;
      }

      throw new Error(res.error?.value?.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      close();
    },
  });

  return (
    <div className="modal-box">
      <h1 className="font-bold mb-4">
        Are you sure you want to delete the room "{room?.name}"?
      </h1>
      <div className="flex gap-4 justify-center items-center">
        <button className="btn btn-ghost" onClick={close} disabled={isPending}>
          Cancel
        </button>
        <button
          className="btn btn-error"
          onClick={() => {
            if (room) {
              deleteRoom(room._id.toString());
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
