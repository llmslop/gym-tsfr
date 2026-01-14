import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  timeout?: number;
};

const ToastContext = createContext<(toast: Omit<Toast, "id">) => void>(
  () => {},
);

function ToastViewport({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast?: (id: string) => void;
}) {
  const toastIcons = {
    success: CheckCircleIcon,
    info: InformationCircleIcon,
    error: ExclamationCircleIcon,
  };
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`alert grid-cols-[auto_1fr_auto] shadow-lg alert-${t.type}`}
        >
          {(() => {
            const Icon = toastIcons[t.type];
            return <Icon className="size-6 text-info-content" />;
          })()}
          {t.message}
          <button
            onClick={() => removeToast?.(t.id)}
            className="btn btn-square btn-ghost hover:btn-error size-6 text-center align-middle"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([
    // NOTE: uncomment this to test
    // {
    //   id: "example-toast",
    //   message: "This is an example toast message.",
    //   type: "info",
    // },
    // {
    //   id: "example-success-toast",
    //   message:
    //     "This is a success toast message. VVERYLONGTEXTVVERYLONGTEXTVVERYLONGTEXTVVERYLONGTEXTVVERYLONGTEXTVVERYLONGTEXTVERYLONGTEXTV",
    //   type: "success",
    // },
  ]);

  const removeToast = (id: string) =>
    setToasts((toasts) => toasts.filter((t) => t.id !== id));

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }]);
    setTimeout(() => removeToast(id), toast.timeout ?? 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastViewport toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
