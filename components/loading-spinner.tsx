"use client"

import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ message, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className={`${sizeClasses[size]} border-2 border-primary/30 border-t-primary rounded-full`}
      />
      {message && <span className="text-xs font-medium text-muted-foreground">{message}</span>}
    </div>
  )
}

export function LoadingOverlay({ message = "Processing..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner message={message} size="lg" />
      </div>
    </motion.div>
  )
}
