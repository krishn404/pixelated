"use client"

import { useState, useRef, useEffect } from "react"

interface ComparisonSliderProps {
  original: string
  pixelated: string
}

export default function ComparisonSlider({ original, pixelated }: ComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const newPos = ((e.clientX - rect.left) / rect.width) * 100
      setSliderPos(Math.max(0, Math.min(100, newPos)))
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-col-resize group"
      onMouseDown={handleMouseDown}
    >
      {/* Original Image */}
      <img src={original || "/placeholder.svg"} alt="Original" className="w-full h-full object-contain" />

      {/* Pixelated Image Container */}
      <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img
          src={pixelated || "/placeholder.svg"}
          alt="Pixelated"
          className="w-full h-full object-contain"
          style={{ width: `${(100 / sliderPos) * 100}%` }}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 h-full w-1 bg-white shadow-lg cursor-col-resize"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-md">
          <div className="flex gap-1">
            <div className="w-0.5 h-4 bg-neutral-400" />
            <div className="w-0.5 h-4 bg-neutral-400" />
            <div className="w-0.5 h-4 bg-neutral-400" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/40 text-white text-xs px-2 py-1 rounded-sm font-medium">
        Original
      </div>
      <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-sm font-medium">
        Pixelated
      </div>
    </div>
  )
}
