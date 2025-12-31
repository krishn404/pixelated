"use client"

import type React from "react"
import { useState } from "react"

interface ImagePreviewProps {
  imageData: {
    src: string
    width: number
    height: number
  } | null
  pixelatedSrc: string
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  isProcessing: boolean
  previewScale: number
}

export default function ImagePreview({
  imageData,
  pixelatedSrc,
  onImageUpload,
  fileInputRef,
  isProcessing,
  previewScale,
}: ImagePreviewProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  return (
    <div className="space-y-4 h-full flex flex-col">
      <label className="text-xs font-medium text-neutral-700 block">Image Preview</label>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-neutral-300 rounded-sm p-6 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer flex-shrink-0"
        onClick={() => fileInputRef.current?.click()}
      >
        {imageData ? (
          <div className="space-y-2">
            <div className="text-xs text-neutral-600">
              Loaded: {imageData.width}×{imageData.height}px
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-2xl text-neutral-400">📁</div>
            <div className="text-xs text-neutral-600 font-medium">Click to upload or drag image</div>
            <div className="text-xs text-neutral-500">PNG, JPG, GIF up to 10MB</div>
          </div>
        )}
      </div>

      {/* Preview Container */}
      {imageData && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Preview Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowOriginal(false)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                !showOriginal
                  ? "bg-blue-500 border-blue-600 text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Pixelated
            </button>
            <button
              onClick={() => setShowOriginal(true)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                showOriginal
                  ? "bg-blue-500 border-blue-600 text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Original
            </button>
          </div>

          {/* Image Display */}
          <div className="flex-1 border border-neutral-200 rounded-sm bg-white overflow-hidden flex items-center justify-center min-h-0">
            {isProcessing ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="text-xs text-neutral-500">Processing...</div>
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
                </div>
              </div>
            ) : (
              <img
                src={showOriginal ? imageData.src : pixelatedSrc || imageData.src}
                alt={showOriginal ? "Original image" : "Pixelated preview"}
                className="w-full h-full object-contain p-2"
                style={{ maxWidth: `${previewScale}%` }}
              />
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1.5 rounded-sm">
            {showOriginal ? "Original" : "Pixelated"} • {imageData.width}×{imageData.height}px
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
    </div>
  )
}
