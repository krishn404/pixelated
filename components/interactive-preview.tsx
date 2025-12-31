"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface InteractivePreviewProps {
  imageData: {
    src: string
    width: number
    height: number
  } | null
  pixelatedSrc: string
  isProcessing: boolean
  useComparisonSlider?: boolean
}

export default function InteractivePreview({ imageData, pixelatedSrc, isProcessing }: InteractivePreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageData) return

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault()
          setZoom((z) => Math.min(400, z + 10))
          break
        case "-":
        case "_":
          e.preventDefault()
          setZoom((z) => Math.max(10, z - 10))
          break
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(100)
            setPanX(0)
            setPanY(0)
          }
          break
        case "ArrowUp":
          e.preventDefault()
          setPanY((y) => y + 20)
          break
        case "ArrowDown":
          e.preventDefault()
          setPanY((y) => y - 20)
          break
        case "ArrowLeft":
          e.preventDefault()
          setPanX((x) => x + 20)
          break
        case "ArrowRight":
          e.preventDefault()
          setPanX((x) => x - 20)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [imageData])

  const handleWheel = (e: WheelEvent) => {
    if (!imageData) return
    e.preventDefault()

    const delta = e.deltaY > 0 ? -10 : 10
    setZoom((z) => Math.max(10, Math.min(400, z + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 100 && panX === 0 && panY === 0) return

    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setZoom(100)
    setPanX(0)
    setPanY(0)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel as EventListener, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel as EventListener)
  }, [imageData])

  if (!imageData) {
    return (
      <div className="flex-1 border border-neutral-200 rounded-sm bg-white overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs text-neutral-500">No image loaded</div>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex-1 border border-neutral-200 rounded-sm bg-white overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs text-neutral-500">Processing image...</div>
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div
        ref={containerRef}
        className="flex-1 border border-neutral-200 rounded-sm bg-neutral-50 overflow-hidden cursor-move relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <img
            ref={imageRef}
            src={pixelatedSrc || imageData.src}
            alt="Pixelated preview"
            className="max-w-none max-h-none"
            draggable={false}
          />
        </div>

        {/* Zoom Info Badge */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-sm font-medium pointer-events-none">
          {zoom}%
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-sm p-2">
        {/* Zoom Controls */}
        <button
          onClick={() => setZoom((z) => Math.max(10, z - 10))}
          title="Zoom Out (−)"
          className="p-1.5 bg-neutral-100 border border-neutral-300 rounded-xs hover:bg-neutral-200 transition-colors text-neutral-600 text-xs font-bold"
        >
          −
        </button>

        <input
          type="range"
          min="10"
          max="400"
          value={zoom}
          onChange={(e) => setZoom(Number.parseInt(e.target.value))}
          className="flex-1 h-4 bg-neutral-200 border border-neutral-300 rounded-xs cursor-pointer accent-blue-500"
        />

        <button
          onClick={() => setZoom((z) => Math.min(400, z + 10))}
          title="Zoom In (+)"
          className="p-1.5 bg-neutral-100 border border-neutral-300 rounded-xs hover:bg-neutral-200 transition-colors text-neutral-600 text-xs font-bold"
        >
          +
        </button>

        <div className="w-12 text-center text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-300 rounded-xs px-2 py-1">
          {zoom}%
        </div>

        <div className="border-l border-neutral-300 mx-1" />

        {/* Pan Reset */}
        <button
          onClick={resetView}
          title="Reset View (Ctrl+0)"
          className="px-2 py-1 text-xs font-medium bg-neutral-100 border border-neutral-300 rounded-xs hover:bg-neutral-200 transition-colors text-neutral-700"
        >
          Fit
        </button>

        <div className="text-xs text-neutral-500">
          {imageData.width}×{imageData.height}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div
          className="ml-auto text-xs text-neutral-500"
          title="Scroll wheel to zoom, arrow keys to pan, +/- to adjust zoom"
        >
          Scroll to zoom | Arrow keys to pan
        </div>
      </div>
    </div>
  )
}
