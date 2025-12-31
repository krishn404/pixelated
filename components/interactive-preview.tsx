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
  onZoomChange?: (zoom: number) => void
}

interface TouchState {
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  initialDistance?: number
}

export default function InteractivePreview({
  imageData,
  pixelatedSrc,
  isProcessing,
  onZoomChange,
}: InteractivePreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [inertiaAnimating, setInertiaAnimating] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [baseFitScale, setBaseFitScale] = useState(100)
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const touchStateRef = useRef<TouchState>({
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
  })
  const inertiaAnimFrameRef = useRef<number | null>(null)
  const transformRef = useRef<HTMLDivElement>(null)

  const MIN_ZOOM = 100
  const MAX_ZOOM = 400
  const INERTIA_FRICTION = 0.95

  useEffect(() => {
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
    setIsMobileDevice(isMobile)
  }, [])

  useEffect(() => {
    if (imageData && imageRef.current && containerRef.current) {
      const container = containerRef.current
      const imageWidth = imageData.width
      const imageHeight = imageData.height

      if (isMobileDevice) {
        // Mobile: canvas follows image aspect ratio
        const aspectRatio = imageWidth / imageHeight
        setCanvasAspectRatio(aspectRatio)
        // On mobile, image always fills the container (100% zoom)
        setBaseFitScale(100)
        setZoom(100)
      } else {
        // Desktop: use contain logic
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        const scaleX = containerWidth / imageWidth
        const scaleY = containerHeight / imageHeight
        const fitScale = Math.min(scaleX, scaleY, 1) * 100
        setBaseFitScale(Math.max(fitScale, 50))
        setZoom(fitScale)
        setCanvasAspectRatio(null)
      }
      setPanX(0)
      setPanY(0)
    }

    return () => {
      if (inertiaAnimFrameRef.current) {
        cancelAnimationFrame(inertiaAnimFrameRef.current)
      }
    }
  }, [imageData, isMobileDevice])

  useEffect(() => {
    onZoomChange?.(zoom)
  }, [zoom, onZoomChange])

  const constrainPan = (newPanX: number, newPanY: number, currentZoom: number) => {
    if (!containerRef.current || !imageData) return { x: newPanX, y: newPanY }

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const imageScale = currentZoom / 100

    const scaledImageWidth = imageData.width * imageScale
    const scaledImageHeight = imageData.height * imageScale

    const maxPanX = (scaledImageWidth - containerWidth) / 2
    const maxPanY = (scaledImageHeight - containerHeight) / 2

    const constrainedX = scaledImageWidth > containerWidth ? Math.max(-maxPanX, Math.min(maxPanX, newPanX)) : 0
    const constrainedY = scaledImageHeight > containerHeight ? Math.max(-maxPanY, Math.min(maxPanY, newPanY)) : 0

    return {
      x: constrainedX,
      y: constrainedY,
    }
  }

  const updateTransform = (x: number, y: number, z: number) => {
    if (transformRef.current) {
      transformRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z / 100})`
    }
  }

  const startInertiaAnimation = (
    velocityX: number,
    velocityY: number,
    initialPanX: number,
    initialPanY: number,
    currentZoom: number,
  ) => {
    if (inertiaAnimFrameRef.current) {
      cancelAnimationFrame(inertiaAnimFrameRef.current)
    }

    setInertiaAnimating(true)
    let currentVelX = velocityX
    let currentVelY = velocityY
    let currentX = initialPanX
    let currentY = initialPanY

    const animate = () => {
      currentVelX *= INERTIA_FRICTION
      currentVelY *= INERTIA_FRICTION

      if (Math.abs(currentVelX) < 0.1 && Math.abs(currentVelY) < 0.1) {
        setInertiaAnimating(false)
        return
      }

      currentX += currentVelX
      currentY += currentVelY

      const constrained = constrainPan(currentX, currentY, currentZoom)
      updateTransform(constrained.x, constrained.y, currentZoom)
      setPanX(constrained.x)
      setPanY(constrained.y)

      inertiaAnimFrameRef.current = requestAnimationFrame(animate)
    }

    inertiaAnimFrameRef.current = requestAnimationFrame(animate)
  }

  const handleWheel = (e: WheelEvent) => {
    if (!imageData || isMobileDevice) return
    e.preventDefault()

    const delta = e.deltaY > 0 ? -10 : 10
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileDevice) return

    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      touchStateRef.current.initialDistance = distance
      setIsDragging(true)
    } else if (e.touches.length === 1) {
      // Single finger pan
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY })
      touchStateRef.current.lastX = touch.clientX
      touchStateRef.current.lastY = touch.clientY
      touchStateRef.current.lastTime = Date.now()
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobileDevice || !isDragging) return

    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const initialDistance = touchStateRef.current.initialDistance

      if (initialDistance) {
        const scale = distance / initialDistance
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * scale))

        setZoom(newZoom)
        touchStateRef.current.initialDistance = distance

        // Prevent page scroll during pinch
        e.preventDefault()
      }
    } else if (e.touches.length === 1) {
      // Single finger pan - only when zoomed in
      if (zoom <= baseFitScale) return

      e.preventDefault()

      const touch = e.touches[0]
      const now = Date.now()
      const timeDelta = now - touchStateRef.current.lastTime
      const dx = touch.clientX - touchStateRef.current.lastX
      const dy = touch.clientY - touchStateRef.current.lastY

      if (timeDelta > 0) {
        touchStateRef.current.velocityX = dx / timeDelta
        touchStateRef.current.velocityY = dy / timeDelta
      }

      touchStateRef.current.lastX = touch.clientX
      touchStateRef.current.lastY = touch.clientY
      touchStateRef.current.lastTime = now

      const newPanX = touch.clientX - dragStart.x
      const newPanY = touch.clientY - dragStart.y
      const constrained = constrainPan(newPanX, newPanY, zoom)

      updateTransform(constrained.x, constrained.y, zoom)
      setPanX(constrained.x)
      setPanY(constrained.y)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (
        isDragging &&
        e.touches.length === 0 &&
        (Math.abs(touchStateRef.current.velocityX) > 0.5 || Math.abs(touchStateRef.current.velocityY) > 0.5)
      ) {
        startInertiaAnimation(
          touchStateRef.current.velocityX * 10,
          touchStateRef.current.velocityY * 10,
          panX,
          panY,
          zoom,
        )
      }
      setIsDragging(false)
      touchStateRef.current.initialDistance = undefined
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imageData || isMobileDevice) return

      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault()
          setZoom((z) => Math.min(MAX_ZOOM, z + 10))
          break
        case "-":
        case "_":
          e.preventDefault()
          setZoom((z) => Math.max(MIN_ZOOM, z - 10))
          break
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(baseFitScale)
            setPanX(0)
            setPanY(0)
          }
          break
        case "ArrowUp":
          e.preventDefault()
          setPanY((y) => {
            const constrained = constrainPan(panX, y + 20, zoom)
            return constrained.y
          })
          break
        case "ArrowDown":
          e.preventDefault()
          setPanY((y) => {
            const constrained = constrainPan(panX, y - 20, zoom)
            return constrained.y
          })
          break
        case "ArrowLeft":
          e.preventDefault()
          setPanX((x) => {
            const constrained = constrainPan(x + 20, panY, zoom)
            return constrained.x
          })
          break
        case "ArrowRight":
          e.preventDefault()
          setPanX((x) => {
            const constrained = constrainPan(x - 20, panY, zoom)
            return constrained.x
          })
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [imageData, panX, panY, zoom, baseFitScale, isMobileDevice])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobileDevice) return
    if (zoom === baseFitScale && panX === 0 && panY === 0) return
    if ((e.target as HTMLElement).closest("button, input, a")) return

    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isMobileDevice) return

    const newPanX = e.clientX - dragStart.x
    const newPanY = e.clientY - dragStart.y
    const constrained = constrainPan(newPanX, newPanY, zoom)

    updateTransform(constrained.x, constrained.y, zoom)
    setPanX(constrained.x)
    setPanY(constrained.y)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  useEffect(() => {
    updateTransform(panX, panY, zoom)
  }, [zoom, panX, panY])

  const resetView = () => {
    setZoom(baseFitScale)
    setPanX(0)
    setPanY(0)
    if (inertiaAnimFrameRef.current) {
      cancelAnimationFrame(inertiaAnimFrameRef.current)
    }
    setInertiaAnimating(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel as EventListener, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel as EventListener)
  }, [imageData, isMobileDevice])

  if (!imageData) {
    return (
      <div className="flex-1 border border-border rounded-sm bg-card overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground">No image loaded</div>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex-1 border border-border rounded-sm bg-card overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground">Processing image...</div>
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div
        ref={containerRef}
        className={`flex-1 border border-border rounded-sm bg-secondary overflow-hidden relative touch-none select-none ${
          isMobileDevice ? "cursor-default" : "cursor-move"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          touchAction: isMobileDevice ? "none" : "auto",
          aspectRatio: isMobileDevice && canvasAspectRatio ? `${canvasAspectRatio}` : undefined,
        }}
      >
        <div
          ref={transformRef}
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            transformOrigin: "center",
            willChange: isDragging || inertiaAnimating ? "transform" : "auto",
          }}
        >
          <img
            ref={imageRef}
            src={pixelatedSrc || imageData.src}
            alt="Pixelated preview"
            className="max-w-none max-h-none"
            draggable={false}
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {!isMobileDevice && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-sm font-medium pointer-events-none">
            {Math.round(zoom)}%
          </div>
        )}
      </div>

      {/* Control Bar - Desktop only */}
      <div className="hidden md:flex items-center gap-2 bg-card border border-border rounded-sm p-2 overflow-x-auto">
        {/* Zoom Controls */}
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 10))}
          title="Zoom Out (−)"
          className="flex-shrink-0 p-1.5 bg-secondary border border-border rounded-xs hover:bg-muted transition-colors text-foreground text-xs font-bold"
        >
          −
        </button>

        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          value={zoom}
          onChange={(e) => setZoom(Number.parseInt(e.target.value))}
          className="flex-1 h-4 bg-muted border border-border rounded-xs cursor-pointer accent-primary"
        />

        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 10))}
          title="Zoom In (+)"
          className="flex-shrink-0 p-1.5 bg-secondary border border-border rounded-xs hover:bg-muted transition-colors text-foreground text-xs font-bold"
        >
          +
        </button>

        <div className="flex-shrink-0 w-12 text-center text-xs font-medium text-foreground bg-secondary border border-border rounded-xs px-2 py-1">
          {Math.round(zoom)}%
        </div>

        <div className="flex-shrink-0 border-l border-border mx-1" />

        {/* Pan Reset */}
        <button
          onClick={resetView}
          title="Reset View (Ctrl+0)"
          className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-secondary border border-border rounded-xs hover:bg-muted transition-colors text-foreground"
        >
          Fit
        </button>

        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {imageData.width}×{imageData.height}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div
          className="ml-auto flex-shrink-0 text-xs text-muted-foreground hidden sm:block"
          title="Scroll wheel to zoom, arrow keys to pan, +/- to adjust zoom"
        >
          Scroll to zoom | Pan to drag
        </div>
      </div>
    </div>
  )
}
