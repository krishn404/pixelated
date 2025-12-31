"use client"

interface PixelationControlsProps {
  pixelSize: number
  setPixelSize: (size: number) => void
  previewScale: number
  setPreviewScale: (scale: number) => void
  onDownload: () => void
  hasImage: boolean
  isProcessing: boolean
}

export default function PixelationControls({
  pixelSize,
  setPixelSize,
  previewScale,
  setPreviewScale,
  onDownload,
  hasImage,
  isProcessing,
}: PixelationControlsProps) {
  const handlePixelSizeChange = (value: string) => {
    const num = Number.parseInt(value)
    if (!Number.isNaN(num)) {
      setPixelSize(Math.min(100, Math.max(1, num)))
    }
  }

  const handlePreviewScaleChange = (value: string) => {
    const num = Number.parseInt(value)
    if (!Number.isNaN(num)) {
      setPreviewScale(Math.min(200, Math.max(10, num)))
    }
  }

  return (
    <div className="space-y-5">
      {/* Pixel Size Control */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-700 block">Pixel Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="100"
            value={pixelSize}
            onChange={(e) => setPixelSize(Number.parseInt(e.target.value))}
            disabled={!hasImage}
            className="flex-1 h-5 bg-neutral-200 border border-neutral-300 rounded-xs cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            min="1"
            max="100"
            value={pixelSize}
            onChange={(e) => handlePixelSizeChange(e.target.value)}
            disabled={!hasImage}
            className="w-14 px-2 py-1 text-xs border border-neutral-300 rounded-xs bg-white text-neutral-700 focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:bg-neutral-100"
          />
        </div>
        <div className="text-xs text-neutral-500">{pixelSize}px blocks</div>
      </div>

      {/* Preview Scale Control */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-neutral-700 block">Preview Size</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="10"
            max="200"
            value={previewScale}
            onChange={(e) => setPreviewScale(Number.parseInt(e.target.value))}
            disabled={!hasImage}
            className="flex-1 h-5 bg-neutral-200 border border-neutral-300 rounded-xs cursor-pointer accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            min="10"
            max="200"
            value={previewScale}
            onChange={(e) => handlePreviewScaleChange(e.target.value)}
            disabled={!hasImage}
            className="w-14 px-2 py-1 text-xs border border-neutral-300 rounded-xs bg-white text-neutral-700 focus:outline-none focus:border-blue-400 disabled:opacity-50 disabled:bg-neutral-100"
          />
        </div>
        <div className="text-xs text-neutral-500">{previewScale}% view</div>
      </div>

      {/* Download Button */}
      <div className="pt-3 border-t border-neutral-200">
        <button
          onClick={onDownload}
          disabled={!hasImage || isProcessing}
          className={`w-full px-3 py-2.5 text-xs font-medium rounded-sm border transition-colors flex items-center justify-center gap-2 ${
            hasImage && !isProcessing
              ? "bg-blue-500 border-blue-600 text-white hover:bg-blue-600 active:bg-blue-700"
              : "bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed"
          }`}
        >
          <span>{isProcessing ? "" : ""}</span>
          {isProcessing ? "Processing..." : "Download PNG"}
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-white border border-neutral-200 rounded-sm p-2.5 space-y-2">
        <div className="text-xs font-medium text-neutral-700">Settings</div>
        <div className="space-y-1 text-xs text-neutral-600">
          <div className="flex justify-between">
            <span>Pixel Size:</span>
            <span className="font-medium text-neutral-700">{pixelSize}px</span>
          </div>
          <div className="flex justify-between">
            <span>Preview:</span>
            <span className="font-medium text-neutral-700">{previewScale}%</span>
          </div>
          {hasImage && <div className="pt-1 border-t border-neutral-200 mt-1 text-neutral-500">Ready to download</div>}
        </div>
      </div>
    </div>
  )
}
