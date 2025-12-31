"use client"

import { type PixelSettings, COMMON_PRESETS, pixelateImage } from "@/lib/pixel-engine"
import { useState, useEffect } from "react"

interface PresetBrowserProps {
  imageData: {
    src: string
    width: number
    height: number
  } | null
  onPresetApply: (settings: PixelSettings) => void
  currentSettings: PixelSettings
}

interface PresetWithPreview extends PixelSettings {
  name: string
  thumbnail: string | null
}

export default function PresetBrowser({ imageData, onPresetApply, currentSettings }: PresetBrowserProps) {
  const [presets, setPresets] = useState<PresetWithPreview[]>([])
  const [customPresets, setCustomPresets] = useState<PresetWithPreview[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"built-in" | "custom">("built-in")

  // Generate preset previews when image loads
  useEffect(() => {
    if (!imageData) {
      setPresets([])
      setCustomPresets([])
      return
    }

    setIsGenerating(true)

    const generatePreviews = async () => {
      const presetPromises = COMMON_PRESETS.map(async (preset) => {
        try {
          const thumbnail = await pixelateImage(imageData.src, preset.settings)
          return { ...preset.settings, name: preset.name, thumbnail }
        } catch {
          return { ...preset.settings, name: preset.name, thumbnail: null }
        }
      })

      const generated = await Promise.all(presetPromises)
      setPresets(generated)
    }

    // Load custom presets from storage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixel-presets")
      if (saved) {
        const customList = JSON.parse(saved) as Array<{ name: string; settings: PixelSettings }>
        const customPromises = customList.map(async (preset) => {
          try {
            const thumbnail = await pixelateImage(imageData.src, preset.settings)
            return { ...preset.settings, name: preset.name, thumbnail }
          } catch {
            return { ...preset.settings, name: preset.name, thumbnail: null }
          }
        })

        Promise.all(customPromises).then((generated) => {
          setCustomPresets(generated)
        })
      }
    }

    generatePreviews().then(() => {
      setIsGenerating(false)
    })
  }, [imageData])

  const deleteCustomPreset = (name: string) => {
    const newCustom = customPresets.filter((p) => p.name !== name)
    setCustomPresets(newCustom)

    if (typeof window !== "undefined") {
      const saved = newCustom.map((p) => ({
        name: p.name,
        settings: {
          pixelSize: p.pixelSize,
          shape: p.shape,
          sampling: p.sampling,
          colorEffect: p.colorEffect,
          paletteSize: p.paletteSize,
          showGrid: p.showGrid,
          duotoneColor1: p.duotoneColor1,
          duotoneColor2: p.duotoneColor2,
          posterizeLevels: p.posterizeLevels,
        },
      }))
      localStorage.setItem("pixel-presets", JSON.stringify(saved))
    }
  }

  const saveCurrentAsPreset = async () => {
    const name = prompt("Preset name:")
    if (!name || !imageData) return

    setIsGenerating(true)
    try {
      const thumbnail = await pixelateImage(imageData.src, currentSettings)
      const newPreset = { ...currentSettings, name, thumbnail }
      const updated = [...customPresets, newPreset]
      setCustomPresets(updated)

      if (typeof window !== "undefined") {
        const saved = updated.map((p) => ({
          name: p.name,
          settings: {
            pixelSize: p.pixelSize,
            shape: p.shape,
            sampling: p.sampling,
            colorEffect: p.colorEffect,
            paletteSize: p.paletteSize,
            showGrid: p.showGrid,
            duotoneColor1: p.duotoneColor1,
            duotoneColor2: p.duotoneColor2,
            posterizeLevels: p.posterizeLevels,
          },
        }))
        localStorage.setItem("pixel-presets", JSON.stringify(saved))
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const displayedPresets = activeTab === "built-in" ? presets : customPresets

  if (!imageData) {
    return <div className="text-xs text-muted-foreground p-4 text-center">Upload an image to preview presets</div>
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("built-in")}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm border transition-colors ${
            activeTab === "built-in"
              ? "bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white"
              : "bg-card border-border text-foreground hover:bg-secondary"
          }`}
        >
          Built-in
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm border transition-colors ${
            activeTab === "custom"
              ? "bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500 text-white"
              : "bg-card border-border text-foreground hover:bg-secondary"
          }`}
        >
          Saved ({customPresets.length})
        </button>
      </div>

      {/* Save Current Button */}
      <button
        onClick={saveCurrentAsPreset}
        disabled={isGenerating}
        className="w-full px-3 py-2 text-xs font-medium bg-purple-500 dark:bg-purple-600 text-white rounded-sm border border-purple-600 dark:border-purple-500 hover:bg-purple-600 dark:hover:bg-purple-500 transition-colors disabled:opacity-50"
      >
        {isGenerating ? "Saving..." : "Save Current Settings"}
      </button>

      {/* Preset Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2">
        {displayedPresets.length === 0 ? (
          <div className="col-span-2 text-xs text-muted-foreground text-center py-8">
            {activeTab === "custom" ? "No saved presets yet" : "Loading presets..."}
          </div>
        ) : (
          displayedPresets.map((preset) => (
            <div
              key={preset.name}
              className="relative group cursor-pointer rounded-sm overflow-hidden border-2 border-border hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onClick={() =>
                onPresetApply({
                  pixelSize: preset.pixelSize,
                  shape: preset.shape,
                  sampling: preset.sampling,
                  colorEffect: preset.colorEffect,
                  paletteSize: preset.paletteSize,
                  showGrid: preset.showGrid,
                  duotoneColor1: preset.duotoneColor1,
                  duotoneColor2: preset.duotoneColor2,
                  posterizeLevels: preset.posterizeLevels,
                })
              }
            >
              {/* Thumbnail */}
              {preset.thumbnail ? (
                <img
                  src={preset.thumbnail || "/placeholder.svg"}
                  alt={preset.name}
                  className="w-full h-24 object-cover group-hover:brightness-110 transition-all"
                />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">Loading...</div>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-2">
                <div className="text-xs font-medium text-white drop-shadow-lg bg-black/40 px-2 py-1 rounded-xs">
                  {preset.name}
                </div>

                {activeTab === "custom" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCustomPreset(preset.name)
                    }}
                    className="text-xs text-red-300 hover:text-red-100 bg-black/40 px-2 py-1 rounded-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground bg-secondary px-2 py-1.5 rounded-sm">
        Click a preset to apply, or save your current settings as a custom preset
      </div>
    </div>
  )
}
