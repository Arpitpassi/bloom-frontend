import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = (title: string, message: string) => addToast("success", title, message);
  const showError = (title: string, message: string) => addToast("error", title, message);
  const showWarning = (title: string, message: string) => addToast("warning", title, message);
  const showInfo = (title: string, message: string) => addToast("info", title, message);

  return { toasts, removeToast, showSuccess, showError, showWarning, showInfo };
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-xl shadow-md text-white text-sm max-w-sm ${
            toast.type === "success" ? "bg-green-500" :
            toast.type === "error" ? "bg-red-500" :
            toast.type === "warning" ? "bg-yellow-500" :
            "bg-blue-500"
          }`}
        >
          <div>
            <div className="font-semibold">{toast.title}</div>
            <div>{toast.message}</div>
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}