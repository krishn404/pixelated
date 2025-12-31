"use client"

import type { PixelSettings } from "@/lib/pixel-engine"
import PresetBrowser from "./preset-browser"
import { useState } from "react"

interface PresetPanelProps {
  imageData: {
    src: string
    width: number
    height: number
  } | null
  onPresetApply: (settings: PixelSettings) => void
  currentSettings: PixelSettings
}

export default function PresetPanel({ imageData, onPresetApply, currentSettings }: PresetPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 px-4 py-3 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-semibold border border-blue-600 z-40"
        title="Open preset browser"
      >
        <span>Presets</span>
        <span className="text-xs bg-blue-600 rounded px-2 py-0.5">New</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="w-96 bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-25">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-neutral-900">Presets</h2>
                <p className="text-xs text-neutral-600">Quick creative effects for your images</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded-md transition-colors text-lg font-semibold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
              <PresetBrowser
                imageData={imageData}
                onPresetApply={(settings) => {
                  onPresetApply(settings)
                  setIsOpen(false)
                }}
                currentSettings={currentSettings}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
