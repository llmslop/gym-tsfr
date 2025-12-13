import { RoleBadge } from "@/components/role-badge";
import { authClient } from "@/lib/auth-client";
import { PlusIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/eden";

function ProfilePictureUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);

    // TODO: send `file` to your server or S3/GCS
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-32 h-32 rounded-full bg-base-300 overflow-hidden cursor-pointer ring ring-primary/40 hover:ring-primary transition-all"
        onClick={handleClick}
      >
        {preview ? (
          <img
            src={preview}
            className="w-full h-full object-cover"
            alt="preview"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/60">
            Upload
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleChange}
      />
    </div>
  );
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function GeneralInformation({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const generalInfoSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phoneNumber: z.string().nonempty("Phone number is required"),
    occupation: z.string().optional(),
    birthday: z
      .string()
      .optional()
      .transform((v) => (v ? new Date(v) : undefined)),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      name: session.user.name,
      phoneNumber: session.user.phoneNumber,
      occupation: session.user.occupation ?? "",
      birthday: session.user.birthday
        ? toDateInputValue(session.user.birthday)
        : undefined,
    },
  });

  const [isPending, setIsPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const onSubmit = async (data: z.infer<typeof generalInfoSchema>) => {
    try {
      setIsPending(true);
      await authClient.updateUser(
        {
          name: data.name,
          phoneNumber: data.phoneNumber,
          occupation: data.occupation ?? undefined,
          birthday: data.birthday ?? undefined,
        },
        {
          onError: (context) => {
            setEditError(context.error.message);
          },
        },
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
        <legend className="fieldset-legend">General information</legend>

        {editError && <p className="text-error-content">{editError}</p>}

        <label className="fieldset-label" htmlFor={`aigi-email`}>
          Email
        </label>
        <input
          className="input input-border"
          type="email"
          value={session.user.email}
          disabled={true}
          readOnly
        />

        <label htmlFor="aigi-name" className="fieldset-label">
          Full name
        </label>
        <input
          type="text"
          className="input input-border"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-error-content">{errors.name.message}</p>
        )}

        <label htmlFor="accountinfo-phonenumber" className="fieldset-label">
          Phone number
        </label>
        <input
          type="text"
          className="input input-border"
          {...register("phoneNumber")}
        />
        {errors.phoneNumber && (
          <p className="text-error-content">{errors.phoneNumber.message}</p>
        )}

        <label htmlFor="accountinfo-occupation" className="fieldset-label">
          Occupation
        </label>
        <input
          type="text"
          className="input input-border"
          {...register("occupation")}
        />
        {errors.occupation && (
          <p className="text-error-content">{errors.occupation.message}</p>
        )}

        <label htmlFor="accountinfo-birthday" className="fieldset-label">
          Birthday
        </label>
        <input
          type="date"
          className="input input-border"
          {...register("birthday")}
        />

        <button
          type="submit"
          className="btn btn-primary mt-2 max-w-20"
          disabled={isPending}
        >
          Save
        </button>
      </fieldset>
    </form>
  );
}

function UpdateAvatar({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    session.user.image ?? null,
  );
  const [file, setFile] = useState<File | null>(null);

  const {
    mutate: updateAvatar,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (file: File) => {
      const res = await api.avatar.upload.post({ file });
      if (res.status === 200) {
        return res.data;
      }

      throw new Error(res.error?.value?.message || "Upload failed");
    },
    onSuccess: async (data) => {
      if (data) {
        setPreview(data.avatarUrl);

        // HACK: refresh session profile image
        await authClient.updateUser({ image: data.avatarUrl });
      }
      setFile(null);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateAvatar(file!);
      }}
      className="max-w-lg w-full"
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
        <legend className="fieldset-legend">Profile picture</legend>
        {error && <p className="text-error-content">{error.message}</p>}

        <div className="avatar">
          <div className="ring-primary ring-offset-base-100 w-24 rounded-full ring-2 ring-offset-2">
            <div className="grid grid-rows-1 grid-cols-1 place-items-center h-full text-lg group">
              {preview ? (
                <img
                  className="row-start-1 col-start-1"
                  src={preview}
                  alt="User profile picture"
                />
              ) : (
                <span className="row-start-1 col-start-1">No picture</span>
              )}
              <div
                className="row-start-1 col-start-1 hidden group-hover:flex w-full h-full justify-center items-center backdrop-brightness-50 hover:cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon className="size-8" />
              </div>
            </div>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFile(file);
            setPreview(URL.createObjectURL(file));
          }}
        />

        <button
          type="submit"
          className="btn btn-primary mt-2 max-w-50"
          disabled={isPending || file === null}
          onClick={() => {}}
        >
          Update profile picture
        </button>
      </fieldset>
    </form>
  );
}

function UpdatePassword() {
  const updatePasswordSchema = z
    .object({
      currentPassword: z.string().nonempty(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
      confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updatePasswordSchema),
  });

  const [isPending, setIsPending] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const onSubmit = async (data: z.infer<typeof updatePasswordSchema>) => {
    try {
      setIsPending(true);
      setUpdateError(null);
      await authClient.changePassword(
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          onError: (context) => {
            setUpdateError(context.error.message);
          },
        },
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg w-full">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
        <legend className="fieldset-legend">Update password</legend>
        {updateError && <p className="text-error-content">{updateError}</p>}
        <label htmlFor="current-password" className="fieldset-label">
          Current password
        </label>
        <input
          type="password"
          className="input input-border"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-error-content">{errors.currentPassword.message}</p>
        )}

        <label htmlFor="new-password" className="fieldset-label">
          New password
        </label>
        <input
          type="password"
          className="input input-border"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p className="text-error-content">{errors.newPassword.message}</p>
        )}

        <label htmlFor="confirm-new-password" className="fieldset-label">
          Confirm new password
        </label>
        <input
          type="password"
          className="input input-border"
          {...register("confirmNewPassword")}
        />
        {errors.confirmNewPassword && (
          <p className="text-error-content">
            {errors.confirmNewPassword.message}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary mt-2 max-w-50"
          disabled={isPending}
        >
          Update password
        </button>
      </fieldset>
    </form>
  );
}

function UpdateFingerprint() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const {
    mutate: updateFingerprint,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (file: File) => {
      const res = await api.biometric.fingerprint.upload.post({ file });
      if (res.status === 200) {
        return res.data;
      }

      throw new Error(res.error?.value?.message || "Upload failed");
    },
    onSuccess: (data) => {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateFingerprint(file!);
      }}
      className="max-w-lg w-full"
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
        <legend className="fieldset-legend">Fingerprint</legend>
        {error && <p className="text-error-content">{error.message}</p>}

        <input
          type="file"
          accept="*/*"
          ref={fileInputRef}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFile(file);
          }}
        />

        <button
          type="submit"
          className="btn btn-primary mt-2 max-w-50"
          disabled={isPending || file === null}
          onClick={() => {}}
        >
          Update fingerprint
        </button>
      </fieldset>
    </form>
  );
}

export function AccountInfo({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-bold text-2xl">{session.user.name}</h1>
        <RoleBadge role={session.user.role ?? ""} />
      </div>
      <GeneralInformation session={session} />
      <UpdateAvatar session={session} />
      <UpdatePassword />
      <UpdateFingerprint />
    </div>
  );
}
