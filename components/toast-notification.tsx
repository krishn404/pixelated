"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
  duration?: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  useEffect(() => {
    const timers = toasts.map((toast) => {
      const duration = toast.duration || 3000
      return setTimeout(() => onRemove(toast.id), duration)
    })

    return () => timers.forEach(clearTimeout)
  }, [toasts, onRemove])

  return (
    <AnimatePresence mode="popLayout">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium shadow-lg border backdrop-blur-sm ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : toast.type === "error"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  toast.type === "success" ? "bg-emerald-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"
                }`}
              />
              {toast.message}
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: "success" | "error" | "info" = "info", duration?: number) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, removeToast }
}
