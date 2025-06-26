import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

interface ToastProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

interface ToastHook {
  toasts: Toast[]
  showSuccess: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showWarning: (title: string, message: string) => void
  showInfo: (title: string, message: string) => void
  removeToast: (id: string) => void
}

export const useToast = (): ToastHook => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    showSuccess: (title, message) => addToast('success', title, message),
    showError: (title, message) => addToast('error', title, message),
    showWarning: (title, message) => addToast('warning', title, message),
    showInfo: (title, message) => addToast('info', title, message),
    removeToast,
  }
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg border text-sm max-w-md ${
            toast.type === 'success'
              ? 'bg-green-100 border-green-500 text-green-700'
              : toast.type === 'error'
              ? 'bg-red-100 border-red-500 text-red-700'
              : toast.type === 'warning'
              ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
              : 'bg-blue-100 border-blue-500 text-blue-700'
          }`}
        >
          <div>
            <div className="font-semibold">{toast.title}</div>
            <div>{toast.message}</div>
          </div>
          <button onClick={() => onRemove(toast.id)} className="ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}