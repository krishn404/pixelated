"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import PixelationWindow from "@/components/pixelation-window"
import { ToastContainer, useToast } from "@/components/toast-notification"

export default function Home() {
  const [imageData, setImageData] = useState<{
    src: string
    width: number
    height: number
    fileName?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, addToast, removeToast } = useToast()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      addToast("File size exceeds 10MB limit", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")

        setImageData({
          src: event.target?.result as string,
          width: img.width,
          height: img.height,
          fileName: nameWithoutExt,
        })

        addToast(`Loaded ${file.name} (${img.width}×${img.height}px)`, "success")
      }
      img.onerror = () => {
        addToast("Failed to load image. Please try another file.", "error")
      }
      img.src = event.target?.result as string
    }
    reader.onerror = () => {
      addToast("Failed to read file. Please try again.", "error")
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      addToast("File size exceeds 10MB limit", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")

        setImageData({
          src: event.target?.result as string,
          width: img.width,
          height: img.height,
          fileName: nameWithoutExt,
        })

        addToast(`Loaded ${file.name} (${img.width}×${img.height}px)`, "success")
      }
      img.onerror = () => {
        addToast("Failed to load image. Please try another file.", "error")
      }
      img.src = event.target?.result as string
    }
    reader.onerror = () => {
      addToast("Failed to read file. Please try again.", "error")
    }
    reader.readAsDataURL(file)
  }

  return (
    <main 
      className="h-screen w-screen overflow-hidden bg-gradient-to-br from-neutral-100 via-neutral-50 to-blue-50 flex items-center justify-center p-2 md:p-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full max-w-full max-h-full"
      >
        <PixelationWindow imageData={imageData} onImageUpload={handleImageUpload} fileInputRef={fileInputRef} />
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </main>
  )
}
