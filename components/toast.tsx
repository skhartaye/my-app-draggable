"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

function ToastItem({ id, message, type, duration = 3000, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-full",
        {
          "bg-green-50 border-green-200 text-green-800": type === 'success',
          "bg-red-50 border-red-200 text-red-800": type === 'error',
          "bg-blue-50 border-blue-200 text-blue-800": type === 'info',
        }
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="text-current hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type'] = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const toast: Toast = { id, message, type, duration }
    setToasts((prev) => [...prev, toast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }
}