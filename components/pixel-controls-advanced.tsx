"use client"

import { type SamplingMode, type ColorEffect, type PixelSettings, COMMON_PRESETS } from "@/lib/pixel-engine"
import { useState } from "react"

interface AdvancedControlsProps {
  settings: PixelSettings
  onSettingsChange: (settings: PixelSettings) => void
  hasImage: boolean
  isProcessing: boolean
  onDownload: (scale: number) => void
  onCopyClipboard: () => void
}

const PIXEL_SNAP_POINTS = [2, 4, 6, 8, 10, 12, 16, 20, 24, 32]

export default function PixelControlsAdvanced({
  settings,
  onSettingsChange,
  hasImage,
  isProcessing,
  onDownload,
  onCopyClipboard,
}: AdvancedControlsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("pixel-size")
  const [showPresets, setShowPresets] = useState(false)
  const [customPresets, setCustomPresets] = useState<Array<{ name: string; settings: PixelSettings }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pixel-presets")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const savePreset = (name: string) => {
    const newPresets = [...customPresets, { name, settings }]
    setCustomPresets(newPresets)
    localStorage.setItem("pixel-presets", JSON.stringify(newPresets))
  }

  const applyPreset = (presetSettings: PixelSettings) => {
    onSettingsChange(presetSettings)
    setShowPresets(false)
  }

  const handlePixelSizeChange = (value: number) => {
    onSettingsChange({ ...settings, pixelSize: Math.max(1, Math.min(100, value)) })
  }

  return (
    <div className="space-y-3">
      {/* Presets Quick Access */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg border border-primary/20 hover:shadow-md transition-all active:scale-95"
        >
          {showPresets ? "Hide Presets" : "Load Preset"}
        </button>

        {showPresets && (
          <div className="absolute top-11 left-0 right-0 bg-white border border-border rounded-lg shadow-lg z-10 p-3 space-y-2 max-h-64 overflow-y-auto">
            <div className="text-xs font-semibold text-foreground px-2">Built-in Presets</div>
            <div className="space-y-1.5">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={(e) => {
                    e.stopPropagation()
                    applyPreset(preset.settings)
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-secondary hover:bg-primary/5 rounded-md transition-colors border border-border hover:border-primary/20"
                >
                  <div className="font-medium text-foreground">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Preset effect</div>
                </button>
              ))}
            </div>

            {customPresets.length > 0 && (
              <>
                <div className="border-t border-border my-2" />
                <div className="text-xs font-semibold text-foreground px-2">Your Presets</div>
                <div className="space-y-1.5">
                  {customPresets.map((preset, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          applyPreset(preset.settings)
                        }}
                        className="flex-1 text-left px-3 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200 text-emerald-900"
                      >
                        <div className="font-medium">{preset.name}</div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCustomPresets(customPresets.filter((_, i) => i !== idx))
                          localStorage.setItem(
                            "pixel-presets",
                            JSON.stringify(customPresets.filter((_, i) => i !== idx)),
                          )
                        }}
                        className="px-2 py-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                        title="Delete preset"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pixel Size Section */}
      <div className="border border-border rounded-lg bg-white overflow-hidden hover:border-primary/20 transition-colors">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => setExpandedSection(expandedSection === "pixel-size" ? null : "pixel-size")}
        >
          <label className="text-xs font-semibold text-foreground">Pixel Size</label>
          <span className="text-xs font-semibold text-primary">{settings.pixelSize}px</span>
        </div>
        {expandedSection === "pixel-size" && (
          <div
            className="px-4 pb-4 space-y-3 border-t border-border pt-3 bg-secondary/30"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <input
              type="range"
              min="1"
              max="100"
              value={settings.pixelSize}
              onChange={(e) => handlePixelSizeChange(Number.parseInt(e.target.value))}
              disabled={!hasImage}
              className="w-full h-2 bg-border rounded-full cursor-pointer accent-primary disabled:opacity-50"
            />
            <div className="flex gap-1.5 flex-wrap">
              {PIXEL_SNAP_POINTS.map((point) => (
                <button
                  key={point}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePixelSizeChange(point)
                  }}
                  disabled={!hasImage}
                  className={`text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                    settings.pixelSize === point
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white border-border hover:border-primary/30 text-foreground hover:bg-secondary"
                  } disabled:opacity-50`}
                >
                  {point}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Custom Value</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.pixelSize}
                onChange={(e) => handlePixelSizeChange(Number.parseInt(e.target.value) || 1)}
                disabled={!hasImage}
                className="w-full px-3 py-2 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sampling Mode */}
      <div className="border border-border rounded-lg bg-white overflow-hidden hover:border-primary/20 transition-colors">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => setExpandedSection(expandedSection === "sampling" ? null : "sampling")}
        >
          <label className="text-xs font-semibold text-foreground"> Sampling</label>
          <span className="text-xs font-medium text-muted-foreground capitalize">{settings.sampling}</span>
        </div>
        {expandedSection === "sampling" && (
          <div
            className="px-4 pb-4 border-t border-border pt-3 space-y-2.5 bg-secondary/30"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {(["averaged", "nearest"] as SamplingMode[]).map((mode) => (
              <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="sampling"
                  value={mode}
                  checked={settings.sampling === mode}
                  onChange={() => onSettingsChange({ ...settings, sampling: mode })}
                  disabled={!hasImage}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground capitalize">
                    {mode === "averaged" ? "Smooth (Averaged)" : "Sharp (Nearest)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mode === "averaged" ? "Blends colors for smooth effects" : "Preserves sharp pixel edges"}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color Effects */}
      <div className="border border-border rounded-lg bg-white overflow-hidden hover:border-primary/20 transition-colors">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => setExpandedSection(expandedSection === "colors" ? null : "colors")}
        >
          <label className="text-xs font-semibold text-foreground"> Color Effects</label>
          <span className="text-xs font-medium text-muted-foreground capitalize">{settings.colorEffect}</span>
        </div>
        {expandedSection === "colors" && (
          <div
            className="px-4 pb-4 border-t border-border pt-3 space-y-3.5 bg-secondary/30"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {(["normal", "grayscale", "duotone", "posterize"] as ColorEffect[]).map((effect) => (
                <button
                  key={effect}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSettingsChange({ ...settings, colorEffect: effect })
                  }}
                  disabled={!hasImage}
                  className={`px-3 py-2 text-xs rounded-md border font-medium capitalize transition-all ${
                    settings.colorEffect === effect
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white border-border text-foreground hover:border-primary/30 hover:bg-secondary"
                  } disabled:opacity-50`}
                >
                  {effect}
                </button>
              ))}
            </div>

            {settings.colorEffect === "duotone" && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={settings.duotoneColor1 || "#000000"}
                    onChange={(e) => onSettingsChange({ ...settings, duotoneColor1: e.target.value })}
                    disabled={!hasImage}
                    className="w-full h-10 rounded-md cursor-pointer border border-border hover:border-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-2">Secondary Color</label>
                  <input
                    type="color"
                    value={settings.duotoneColor2 || "#ffffff"}
                    onChange={(e) => onSettingsChange({ ...settings, duotoneColor2: e.target.value })}
                    disabled={!hasImage}
                    className="w-full h-10 rounded-md cursor-pointer border border-border hover:border-primary/30"
                  />
                </div>
              </div>
            )}

            {settings.colorEffect === "posterize" && (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-2">
                    Posterize Levels: {settings.posterizeLevels || 4}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={settings.posterizeLevels || 4}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, posterizeLevels: Number.parseInt(e.target.value) })
                    }
                    disabled={!hasImage}
                    className="w-full h-2 bg-border rounded-full cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}

            {settings.colorEffect !== "normal" && (
              <div className="space-y-2.5 pt-1 border-t border-border">
                <label className="text-xs font-semibold text-foreground block">
                  Palette Size: {settings.paletteSize}
                </label>
                <input
                  type="range"
                  min="2"
                  max="256"
                  value={settings.paletteSize}
                  onChange={(e) => onSettingsChange({ ...settings, paletteSize: Number.parseInt(e.target.value) })}
                  disabled={!hasImage}
                  className="w-full h-2 bg-border rounded-full cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Overlay */}
      <label className="flex items-center gap-3 p-4 border border-border rounded-lg bg-white hover:bg-secondary transition-colors cursor-pointer group">
        <input
          type="checkbox"
          checked={settings.showGrid}
          onChange={(e) => onSettingsChange({ ...settings, showGrid: e.target.checked })}
          disabled={!hasImage}
          className="w-4 h-4 cursor-pointer accent-primary"
        />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground"> Show Pixel Grid</span>
          <span className="text-xs text-muted-foreground">Visualize pixel boundaries</span>
        </div>
      </label>

      {/* Export Options */}
      <div className="border border-border rounded-lg bg-white overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <label className="text-xs font-semibold text-foreground">Export Options</label>
        </div>
        <div
          className="p-4 space-y-2.5"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <button
            onClick={() => onDownload(1)}
            disabled={!hasImage || isProcessing}
            className={`w-full px-4 py-2.5 text-xs font-semibold rounded-lg border transition-all ${
              hasImage && !isProcessing
                ? "bg-primary text-primary-foreground border-primary hover:shadow-md active:scale-95"
                : "bg-muted text-muted-foreground border-border cursor-not-allowed"
            }`}
          >
            {isProcessing ? "Processing..." : "  Download 1×"}
          </button>
          <button
            onClick={() => onDownload(2)}
            disabled={!hasImage || isProcessing}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              hasImage && !isProcessing
                ? "bg-secondary text-foreground border-border hover:bg-muted active:scale-95"
                : "bg-muted text-muted-foreground border-border cursor-not-allowed"
            }`}
          >
              Download 2×
          </button>
          <button
            onClick={() => onDownload(4)}
            disabled={!hasImage || isProcessing}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              hasImage && !isProcessing
                ? "bg-secondary text-foreground border-border hover:bg-muted active:scale-95"
                : "bg-muted text-muted-foreground border-border cursor-not-allowed"
            }`}
          >
              Download 4×
          </button>
          <button
            onClick={onCopyClipboard}
            disabled={!hasImage || isProcessing}
            className={`w-full px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              hasImage && !isProcessing
                ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 active:scale-95"
                : "bg-muted text-muted-foreground border-border cursor-not-allowed"
            }`}
          >
             Copy to Clipboard
          </button>
        </div>
      </div>

      {/* Save Preset */}
      {hasImage && (
        <button
          onClick={() => {
            const name = prompt("Preset name:")
            if (name) savePreset(name)
          }}
          className="w-full px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg border border-purple-700 hover:shadow-md transition-all active:scale-95"
        >
          ⭐ Save as Preset
        </button>
      )}
    </div>
  )
}
