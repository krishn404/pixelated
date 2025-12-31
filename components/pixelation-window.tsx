"use client"

import type React from "react"
import { motion } from "framer-motion"
import { UploadIcon, SettingsIcon, DownloadIcon } from "lucide-react"

import { useState, useEffect } from "react"
import InteractivePreview from "./interactive-preview"
import PixelControlsAdvanced from "./pixel-controls-advanced"
import ExportPanel from "./export-panel"
import PresetPanel from "./preset-panel"
import type { PixelSettings } from "@/lib/pixel-engine"
import { pixelateImage } from "@/lib/pixel-engine"
import { useIsMobile } from "@/components/ui/use-mobile"
import { ThemeToggle } from "./theme-toggle"

interface PixelationWindowProps {
  imageData: {
    src: string
    width: number
    height: number
    fileName?: string
  } | null
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

const DEFAULT_SETTINGS: PixelSettings = {
  pixelSize: 8,
  shape: "square",
  sampling: "averaged",
  colorEffect: "normal",
  paletteSize: 256,
  showGrid: false,
}

export default function PixelationWindow({ imageData, onImageUpload, fileInputRef }: PixelationWindowProps) {
  const [settings, setSettings] = useState<PixelSettings>(DEFAULT_SETTINGS)
  const [pixelatedSrc, setPixelatedSrc] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<"controls" | "export">("controls")
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!imageData) {
      setPixelatedSrc("")
      return
    }

    setIsProcessing(true)
    pixelateImage(imageData.src, settings)
      .then((result) => {
        setPixelatedSrc(result)
        setIsProcessing(false)
      })
      .catch((error) => {
        console.error("[pix] Pixelation error:", error)
        setIsProcessing(false)
      })
  }, [imageData, settings])

  const handleDownload = async (scale: number) => {
    if (!imageData) return

    setIsProcessing(true)
    try {
      const { exportImage } = await import("@/lib/pixel-engine")
      const dataUrl = await exportImage(imageData.src, settings, scale)

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = imageData.fileName
        ? `pixelated-${scale}x-${imageData.fileName}`
        : `pixelated-${scale}x-${Date.now()}.png`
      link.click()
    } catch (error) {
      console.error("[pix] Download error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyClipboard = async () => {
    if (!imageData) return

    setIsProcessing(true)
    try {
      const { exportImage } = await import("@/lib/pixel-engine")
      const dataUrl = await exportImage(imageData.src, settings, 1)

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ])

      const feedback = document.createElement("div")
      feedback.textContent = "✓ Copied to clipboard"
      feedback.className =
        "fixed top-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-md text-xs font-medium shadow-lg z-50 border border-emerald-200"
      document.body.appendChild(feedback)
      setTimeout(() => feedback.remove(), 2000)
    } catch (error) {
      console.error("[pix] Clipboard error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className={`w-full h-full bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col ${
        isMobile ? "" : ""
      }`}>
        {/* Title Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border px-4 md:px-5 py-3 md:py-3.5 flex items-center justify-between gap-3.5 flex-shrink-0"
        >
          <div className="flex items-center gap-3.5">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
              className="w-5 h-5 bg-gradient-to-br from-primary to-primary/80 rounded-md shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Pixelator</span>
              <span className="text-xs text-muted-foreground">Image Pixel Art Studio</span>
            </div>
          </div>
          <ThemeToggle />
        </motion.div>

        {/* Main Content Area */}
        <div className={`flex flex-1 overflow-hidden gap-3 md:gap-5 p-3 md:p-5 min-h-0 ${
          isMobile ? "flex-col" : "flex-row"
        }`}>
          {/* Left Panel - Preview Section */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`flex flex-col min-w-0 gap-3 flex-1 min-h-0 ${
              isMobile ? "" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>Preview</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {imageData ? `${imageData.width} × ${imageData.height}px` : "No image loaded"}
                </div>
              </div>
            </div>

            {!imageData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-1 border-2 border-dashed border-border rounded-lg p-6 md:p-8 bg-secondary hover:bg-muted transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 min-h-0"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith("image/")) {
                    // Create a proper FileList-like object
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    const fakeInput = document.createElement("input")
                    fakeInput.type = "file"
                    fakeInput.files = dataTransfer.files
                    const fakeEvent = {
                      target: fakeInput,
                    } as React.ChangeEvent<HTMLInputElement>
                    onImageUpload(fakeEvent)
                  }
                }}
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UploadIcon className="w-8 h-8 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">Upload an Image</div>
                <div className="text-xs text-muted-foreground">Click here or drag and drop</div>
                <div className="text-xs text-muted-foreground/70">PNG, JPG, GIF up to 10MB</div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-1 border border-border rounded-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden shadow-inner min-h-0"
              >
                <InteractivePreview
                  imageData={imageData}
                  pixelatedSrc={pixelatedSrc}
                  isProcessing={isProcessing}
                  useComparisonSlider={false}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Right Panel - Controls & Export - Hidden on mobile, shown via bottom sheets */}
          {!isMobile && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-96 flex flex-col gap-3 min-w-0"
            >
              {/* Tab Navigation */}
              <div className="flex gap-2 bg-secondary p-1.5 rounded-lg border border-border">
                <motion.button
                  onClick={() => setActiveTab("controls")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                    activeTab === "controls"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Settings
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab("export")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
                    activeTab === "export"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Export
                </motion.button>
              </div>

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto bg-card border border-border rounded-lg p-4 space-y-3"
              >
                {activeTab === "controls" ? (
                  <PixelControlsAdvanced
                    settings={settings}
                    onSettingsChange={setSettings}
                    hasImage={!!imageData}
                    isProcessing={isProcessing}
                    onDownload={handleDownload}
                    onCopyClipboard={handleCopyClipboard}
                  />
                ) : (
                  <ExportPanel
                    imageData={imageData}
                    settings={settings}
                    hasImage={!!imageData}
                    isProcessing={isProcessing}
                  />
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Mobile Controls - Bottom Sheet Triggers */}
          {isMobile && (
            <div className="flex-shrink-0 space-y-2">
              <PixelControlsAdvanced
                settings={settings}
                onSettingsChange={setSettings}
                hasImage={!!imageData}
                isProcessing={isProcessing}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
              />
            </div>
          )}
        </div>
      </div>

      {imageData && <PresetPanel imageData={imageData} onPresetApply={setSettings} currentSettings={settings} />}

      {/* Hidden File Input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
    </>
  )
}
