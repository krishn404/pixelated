"use client"

import type { PixelSettings } from "@/lib/pixel-engine"
import { exportImage } from "@/lib/pixel-engine"
import { useState, useCallback } from "react"
import { DownloadIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "./toast-notification"

interface ExportPanelProps {
  imageData: {
    src: string
    width: number
    height: number
    fileName?: string
  } | null
  settings: PixelSettings
  hasImage: boolean
  isProcessing: boolean
}

export default function ExportPanel({ imageData, settings, hasImage, isProcessing }: ExportPanelProps) {
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const [exportedFiles, setExportedFiles] = useState<Array<{ scale: number; dataUrl: string }>>([])
  const { addToast } = useToast()

  const getExportFilename = (scale: number) => {
    if (imageData?.fileName) {
      return `pixelated-${imageData.fileName}-${scale}x.png`
    }
    return `pixelated-${scale}x-${Date.now()}.png`
  }

  const handleExport = useCallback(
    async (scale: number) => {
      if (!imageData) return

      setExportProgress(`Exporting ${scale}×...`)
      try {
        const dataUrl = await exportImage(imageData.src, settings, scale)
        setExportProgress(null)

        const link = document.createElement("a")
        link.href = dataUrl
        link.download = getExportFilename(scale)
        link.click()

        setExportedFiles((prev) => [...prev, { scale, dataUrl }])
        addToast(`Downloaded ${scale}× resolution`, "success")
      } catch (error) {
        console.error("[pix] Export error:", error)
        setExportProgress(null)
        addToast("Export failed. Please try again.", "error")
      }
    },
    [imageData, settings, addToast],
  )

  const handleCopyToClipboard = useCallback(async () => {
    if (!imageData) return

    setExportProgress("Copying to clipboard...")
    try {
      const dataUrl = await exportImage(imageData.src, settings, 1)

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ])

      setExportProgress(null)
      addToast("Copied to clipboard", "success")
    } catch (error) {
      console.error("[pix] Clipboard error:", error)
      setExportProgress(null)
      addToast("Failed to copy to clipboard", "error")
    }
  }, [imageData, settings, addToast])

  const handleBatchExport = useCallback(async () => {
    const scales = [1, 2, 4]
    setExportedFiles([])

    for (const scale of scales) {
      setExportProgress(`Batch exporting ${scale}×...`)
      try {
        const dataUrl = await exportImage(imageData!.src, settings, scale)

        const link = document.createElement("a")
        link.href = dataUrl
        link.download = getExportFilename(scale)
        link.click()

        await new Promise((resolve) => setTimeout(resolve, 500))

        setExportedFiles((prev) => [...prev, { scale, dataUrl }])
      } catch (error) {
        console.error(`[pix] Batch export error for ${scale}×:`, error)
        addToast(`Failed to export ${scale}× version`, "error")
      }
    }

    setExportProgress(null)
    addToast("Batch export completed", "success")
  }, [imageData, settings, addToast])

  const calculateExportDimensions = (scale: number) => {
    if (!imageData) return { w: 0, h: 0 }
    return {
      w: imageData.width * scale,
      h: imageData.height * scale,
    }
  }

  const getResolutionDescription = (scale: number) => {
    switch (scale) {
      case 1:
        return "Standard resolution for standard displays"
      case 2:
        return "Double resolution for Retina and high-DPI displays"
      case 4:
        return "Quadruple resolution for 4K and ultra-high-DPI displays"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3.5 space-y-2">
        <div className="text-xs font-semibold text-blue-900 dark:text-blue-100">Resolution Guide</div>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
          <div>
            <span className="font-medium">1× (Standard)</span> - Default resolution for regular displays
          </div>
          <div>
            <span className="font-medium">2× (Double)</span> - For Retina and high-DPI displays
          </div>
          <div>
            <span className="font-medium">4× (Quadruple)</span> - For 4K and ultra-high-DPI displays
          </div>
        </div>
      </div>

      {/* Export Modes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block uppercase tracking-wider flex items-center gap-2">
          <DownloadIcon className="w-3.5 h-3.5" />
          Single Export
        </label>
        <div className="space-y-2.5">
          {[1, 2, 4].map((scale) => {
            const dims = calculateExportDimensions(scale)
            return (
              <motion.div
                key={scale}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: scale * 0.1 }}
                className="space-y-1"
              >
                <button
                  onClick={() => handleExport(scale)}
                  disabled={!hasImage || isProcessing || !!exportProgress}
                  className={`w-full px-3 py-2.5 text-xs font-medium rounded-md border transition-colors ${
                    hasImage && !isProcessing && !exportProgress
                      ? `bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-500 active:bg-blue-700 dark:active:bg-blue-400`
                      : "bg-muted border-border text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Download {scale}×</span>
                    <span className="text-xs opacity-70">
                      {dims.w}×{dims.h}
                    </span>
                  </div>
                </button>
                <div className="text-xs text-muted-foreground pl-1">{getResolutionDescription(scale)}</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Clipboard Copy */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block uppercase tracking-wider">Clipboard</label>
        <button
          onClick={handleCopyToClipboard}
          disabled={!hasImage || isProcessing || !!exportProgress}
          className={`w-full px-3 py-2.5 text-xs font-medium rounded-md border transition-colors ${
            hasImage && !isProcessing && !exportProgress
              ? "bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500 text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 active:bg-emerald-700 dark:active:bg-emerald-400"
              : "bg-muted border-border text-muted-foreground cursor-not-allowed"
          }`}
        >
          {exportProgress?.includes("Copying") ? "Copying..." : "Copy to Clipboard"}
        </button>
        <p className="text-xs text-muted-foreground">Paste directly into design tools (standard 1× resolution)</p>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Batch Export */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block uppercase tracking-wider">Batch Export</label>
        <button
          onClick={handleBatchExport}
          disabled={!hasImage || isProcessing || !!exportProgress}
          className={`w-full px-3 py-2.5 text-xs font-medium rounded-md border transition-colors ${
            hasImage && !isProcessing && !exportProgress
              ? "bg-purple-500 dark:bg-purple-600 border-purple-600 dark:border-purple-500 text-white hover:bg-purple-600 dark:hover:bg-purple-500 active:bg-purple-700 dark:active:bg-purple-400"
              : "bg-muted border-border text-muted-foreground cursor-not-allowed"
          }`}
        >
          {exportProgress?.includes("Batch") ? "Exporting..." : "Export All Scales (1×, 2×, 4×)"}
        </button>
        <p className="text-xs text-muted-foreground">Download all three resolutions at once for maximum flexibility</p>
      </div>

      {/* Progress Indicator */}
      {exportProgress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-center gap-2"
        >
          <div className="w-4 h-4 border-2 border-blue-300 dark:border-blue-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
          <span className="text-xs text-blue-700 dark:text-blue-300">{exportProgress}</span>
        </motion.div>
      )}

      {/* Export History */}
      {exportedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary border border-border rounded-md p-3 space-y-2"
        >
          <label className="text-xs font-semibold text-foreground">Recent Exports</label>
          <div className="space-y-1">
            {exportedFiles.map((file) => (
              <div key={file.scale} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{file.scale}× scale</span>
                <button
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = file.dataUrl
                    link.download = `pixelated-${file.scale}x-${Date.now()}.png`
                    link.click()
                    addToast(`Re-downloaded ${file.scale}× version`, "success")
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Download again
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Format Info */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-neutral-100 border border-neutral-200 rounded-md p-2.5 space-y-1"
      >
        <div className="text-xs font-semibold text-foreground">Export Format</div>
        <div className="text-xs text-neutral-600 space-y-0.5">
          <div>Format: PNG (lossless)</div>
          <div>Transparency: Preserved</div>
          <div>Watermark: pix.krixnx.xyz included</div>
          <div>Colors: Matched to preview</div>
        </div>
      </motion.div> */}
    </div>
  )
}
