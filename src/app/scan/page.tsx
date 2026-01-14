"use client";

import { useToast } from "@/components/toast-context";
import { api } from "@/lib/eden";
import { QRPayload, QRSigner } from "@/lib/qr";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";
import "barcode-detector/polyfill";

export default function QRScanPage() {
  const [mode, setMode] = useState<"check-in" | "check-out">("check-in");
  const [roomId, setRoomId] = useState<string>("selectroom");
  const [verifier, setVerifier] = useState<QRSigner | undefined>(undefined);
  const [pasteDivBg, setPasteDivBg] = useState<string | undefined>(undefined);
  const [tokenUrl, setTokenUrl] = useState<string | undefined>(undefined);
  const [payload, setQRPayload] = useState<QRPayload | undefined>(undefined);

  const toast = useToast();
  const detector = new BarcodeDetector({ formats: ["qr_code"] });

  useEffect(() => {
    const main = async () => {
      setVerifier(
        await QRSigner.fromPublicKey(
          process.env.NEXT_PUBLIC_QR_SIGNING_PUBLIC_KEY!,
        ),
      );
    };
    main();
  }, []);

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.rooms.list.get();
      if (res.status === 200) return res.data;
      throw new Error("Failed to fetch rooms");
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      url,
      mode,
      roomId,
    }: {
      url: string;
      mode: "check-in" | "check-out";
      roomId: string;
    }) => {
      const { status, error, data } = await api.events.new.post({
        mode,
        url,
        roomId,
      });
      if (status !== 200)
        throw new Error(error?.value?.message ?? "Failed to submit");
    },
    onSuccess: () => {
      toast({ type: "success", message: "Successfully submitted!" });
      setQRPayload(undefined);
      setTokenUrl(undefined);
      setPasteDivBg(undefined);
    },
    onError: (error) => {
      toast({ type: "error", message: error.message });
    },
  });

  const onScan = async (result: IDetectedBarcode[], forceClear: boolean) => {
    try {
      if (verifier === undefined) throw new Error("Verifier not ready");
      console.debug("wt");
      const [payload, tokenUrl] = await Promise.any(
        result.map((barcode) =>
          verifier
            .verifyUrl(barcode.rawValue, false)
            .then(
              (payload) => [payload, barcode.rawValue] as [QRPayload, string],
            ),
        ),
      );
      setQRPayload(payload);
      setTokenUrl(tokenUrl);
    } catch (err) {
      if (err instanceof AggregateError) {
        if (forceClear) {
          setQRPayload(undefined);
          setTokenUrl(undefined);
        }
        console.log("Unable to verify any scanned QR code");
      } else {
        throw err;
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center mx-auto my-4">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "check-in" | "check-out")}
        className="select"
      >
        <option value="check-in">Check-in</option>
        <option value="check-out">Check-out</option>
      </select>
      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="select"
      >
        <option value="selectroom" disabled>
          Select room
        </option>
        {rooms &&
          rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name}
            </option>
          ))}
      </select>
      <div className="w-full flex max-w-md lg:max-w-4xl flex-col lg:flex-row gap-4">
        <div>
          <Scanner
            onScan={(result) => onScan(result, false)}
            onError={(error) => console.debug(error)}
            paused={tokenUrl !== undefined}
          />
        </div>
        <div className="divider lg:divider-horizontal">OR</div>
        <div
          className="w-full aspect-square border border-secondary p-4 bg-center bg-contain bg-no-repeat flex items-center justify-center"
          style={{
            backgroundImage: pasteDivBg ? `url(${pasteDivBg})` : undefined,
          }}
          onPaste={(e) => {
            const images = [...e.clipboardData.files].filter((file) =>
              file.type.startsWith("image/"),
            );
            if (images.length === 0)
              return toast({
                message: "No image found in clipboard",
                type: "error",
              });
            const imageUrl = URL.createObjectURL(images[0]);
            setPasteDivBg(imageUrl);
            detector
              .detect(images[0])
              .then((img) => onScan(img, true))
              .catch(console.error);
          }}
        >
          {pasteDivBg === undefined && "Or paste your QR here."}
        </div>
      </div>

      <div>Current user: {payload ? payload.userName : "None"}</div>

      <button
        onClick={() => {
          roomId && mutate({ url: tokenUrl!, mode, roomId });
        }}
        disabled={
          isPending || tokenUrl === undefined || roomId === "selectroom"
        }
        className="btn btn-primary"
      >
        Submit
      </button>
    </div>
  );
}
