// Advanced pixel processing engine with multiple shape modes and effects

export type PixelShape = "square" | "circle" | "hex" | "isometric"
export type SamplingMode = "averaged" | "nearest"
export type ColorEffect = "normal" | "grayscale" | "duotone" | "posterize"

export interface PixelSettings {
  pixelSize: number
  shape: PixelShape
  sampling: SamplingMode
  colorEffect: ColorEffect
  paletteSize: number
  showGrid: boolean
  duotoneColor1?: string
  duotoneColor2?: string
  posterizeLevels?: number
}

export interface Preset {
  name: string
  settings: PixelSettings
}

const COMMON_PRESETS: Preset[] = [
  {
    name: "Avatar Censor",
    settings: {
      pixelSize: 16,
      shape: "square",
      sampling: "averaged",
      colorEffect: "normal",
      paletteSize: 256,
      showGrid: false,
    },
  },
  {
    name: "Retro Sprite",
    settings: {
      pixelSize: 8,
      shape: "square",
      sampling: "nearest",
      colorEffect: "posterize",
      paletteSize: 64,
      posterizeLevels: 4,
      showGrid: true,
    },
  },
  {
    name: "Mosaic Art",
    settings: {
      pixelSize: 12,
      shape: "hex",
      sampling: "averaged",
      colorEffect: "normal",
      paletteSize: 256,
      showGrid: false,
    },
  },
  {
    name: "Lo-Fi Poster",
    settings: {
      pixelSize: 10,
      shape: "square",
      sampling: "averaged",
      colorEffect: "duotone",
      paletteSize: 32,
      showGrid: false,
      duotoneColor1: "#1a1a2e",
      duotoneColor2: "#ff006e",
    },
  },
  {
    name: "Privacy Blur",
    settings: {
      pixelSize: 20,
      shape: "square",
      sampling: "averaged",
      colorEffect: "normal",
      paletteSize: 256,
      showGrid: false,
    },
  },
]

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function applyGrayscale(r: number, g: number, b: number): [number, number, number] {
  const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
  return [gray, gray, gray]
}

function applyDuotone(r: number, g: number, b: number, color1: string, color2: string): [number, number, number] {
  const gray = r * 0.299 + g * 0.587 + b * 0.114
  const luminance = gray / 255

  const c1 = Number.parseInt(color1.slice(1), 16)
  const c1r = (c1 >> 16) & 255
  const c1g = (c1 >> 8) & 255
  const c1b = c1 & 255

  const c2 = Number.parseInt(color2.slice(1), 16)
  const c2r = (c2 >> 16) & 255
  const c2g = (c2 >> 8) & 255
  const c2b = c2 & 255

  const r_out = Math.round(c1r + (c2r - c1r) * luminance)
  const g_out = Math.round(c1g + (c2g - c1g) * luminance)
  const b_out = Math.round(c1b + (c2b - c1b) * luminance)

  return [r_out, g_out, b_out]
}

function applyPosterize(r: number, g: number, b: number, levels: number): [number, number, number] {
  const step = 256 / levels
  const r_out = Math.round((Math.floor(r / step) * step + step / 2) / step) * step
  const g_out = Math.round((Math.floor(g / step) * step + step / 2) / step) * step
  const b_out = Math.round((Math.floor(b / step) * step + step / 2) / step) * step
  return [Math.min(255, r_out), Math.min(255, g_out), Math.min(255, b_out)]
}

function reducePalette(r: number, g: number, b: number, paletteSize: number): [number, number, number] {
  if (paletteSize >= 256) return [r, g, b]
  const step = Math.ceil(256 / Math.cbrt(paletteSize))
  return [Math.round(r / step) * step, Math.round(g / step) * step, Math.round(b / step) * step]
}

export function pixelateImage(imgSrc: string, settings: PixelSettings): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply pixel effect
        const blockSize = settings.pixelSize
        for (let y = 0; y < canvas.height; y += blockSize) {
          for (let x = 0; x < canvas.width; x += blockSize) {
            let r = 0,
              g = 0,
              b = 0,
              a = 0
            let count = 0

            // Sample color
            if (settings.sampling === "nearest") {
              // Use top-left pixel of the block
              const idx = (y * canvas.width + x) * 4
              r = data[idx]
              g = data[idx + 1]
              b = data[idx + 2]
              a = data[idx + 3]
            } else {
              // Average the block
              for (let dy = 0; dy < blockSize && y + dy < canvas.height; dy++) {
                for (let dx = 0; dx < blockSize && x + dx < canvas.width; dx++) {
                  const idx = ((y + dy) * canvas.width + (x + dx)) * 4
                  r += data[idx]
                  g += data[idx + 1]
                  b += data[idx + 2]
                  a += data[idx + 3]
                  count++
                }
              }
              r = Math.round(r / count)
              g = Math.round(g / count)
              b = Math.round(b / count)
              a = Math.round(a / count)
            }

            // Apply color effects
            let finalR = r,
              finalG = g,
              finalB = b

            if (settings.colorEffect === "grayscale") {
              ;[finalR, finalG, finalB] = applyGrayscale(finalR, finalG, finalB)
            } else if (settings.colorEffect === "duotone" && settings.duotoneColor1 && settings.duotoneColor2) {
              ;[finalR, finalG, finalB] = applyDuotone(
                finalR,
                finalG,
                finalB,
                settings.duotoneColor1,
                settings.duotoneColor2,
              )
            } else if (settings.colorEffect === "posterize" && settings.posterizeLevels) {
              ;[finalR, finalG, finalB] = applyPosterize(finalR, finalG, finalB, settings.posterizeLevels)
            }
            // Apply palette reduction
            ;[finalR, finalG, finalB] = reducePalette(finalR, finalG, finalB, settings.paletteSize)

            // Draw the pixel block
            for (let dy = 0; dy < blockSize && y + dy < canvas.height; dy++) {
              for (let dx = 0; dx < blockSize && x + dx < canvas.width; dx++) {
                const idx = ((y + dy) * canvas.width + (x + dx)) * 4
                data[idx] = finalR
                data[idx + 1] = finalG
                data[idx + 2] = finalB
                data[idx + 3] = a
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0)

        // Draw grid overlay if enabled
        if (settings.showGrid) {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
          ctx.lineWidth = 1
          for (let y = 0; y <= canvas.height; y += blockSize) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(canvas.width, y)
            ctx.stroke()
          }
          for (let x = 0; x <= canvas.width; x += blockSize) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, canvas.height)
            ctx.stroke()
          }
        }

        resolve(canvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = imgSrc
  })
}

export function exportImage(imgSrc: string, settings: PixelSettings, scale = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        canvas.width = img.width * scale
        canvas.height = img.height * scale

        // For scaled export, we need to render at original size first
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })

        if (!tempCtx) {
          reject(new Error("Could not get temp canvas context"))
          return
        }

        tempCanvas.width = img.width
        tempCanvas.height = img.height

        tempCtx.drawImage(img, 0, 0)
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const data = imageData.data

        // Apply pixelation
        const blockSize = settings.pixelSize
        for (let y = 0; y < tempCanvas.height; y += blockSize) {
          for (let x = 0; x < tempCanvas.width; x += blockSize) {
            let r = 0,
              g = 0,
              b = 0,
              a = 0
            let count = 0

            if (settings.sampling === "nearest") {
              const idx = (y * tempCanvas.width + x) * 4
              r = data[idx]
              g = data[idx + 1]
              b = data[idx + 2]
              a = data[idx + 3]
            } else {
              for (let dy = 0; dy < blockSize && y + dy < tempCanvas.height; dy++) {
                for (let dx = 0; dx < blockSize && x + dx < tempCanvas.width; dx++) {
                  const idx = ((y + dy) * tempCanvas.width + (x + dx)) * 4
                  r += data[idx]
                  g += data[idx + 1]
                  b += data[idx + 2]
                  a += data[idx + 3]
                  count++
                }
              }
              r = Math.round(r / count)
              g = Math.round(g / count)
              b = Math.round(b / count)
              a = Math.round(a / count)
            }

            let finalR = r,
              finalG = g,
              finalB = b

            if (settings.colorEffect === "grayscale") {
              ;[finalR, finalG, finalB] = applyGrayscale(finalR, finalG, finalB)
            } else if (settings.colorEffect === "duotone" && settings.duotoneColor1 && settings.duotoneColor2) {
              ;[finalR, finalG, finalB] = applyDuotone(
                finalR,
                finalG,
                finalB,
                settings.duotoneColor1,
                settings.duotoneColor2,
              )
            } else if (settings.colorEffect === "posterize" && settings.posterizeLevels) {
              ;[finalR, finalG, finalB] = applyPosterize(finalR, finalG, finalB, settings.posterizeLevels)
            }
            ;[finalR, finalG, finalB] = reducePalette(finalR, finalG, finalB, settings.paletteSize)

            for (let dy = 0; dy < blockSize && y + dy < tempCanvas.height; dy++) {
              for (let dx = 0; dx < blockSize && x + dx < tempCanvas.width; dx++) {
                const idx = ((y + dy) * tempCanvas.width + (x + dx)) * 4
                data[idx] = finalR
                data[idx + 1] = finalG
                data[idx + 2] = finalB
                data[idx + 3] = a
              }
            }
          }
        }

        tempCtx.putImageData(imageData, 0, 0)

        if (settings.showGrid) {
          tempCtx.strokeStyle = "rgba(0, 0, 0, 0.2)"
          tempCtx.lineWidth = 1
          for (let y = 0; y <= tempCanvas.height; y += blockSize) {
            tempCtx.beginPath()
            tempCtx.moveTo(0, y)
            tempCtx.lineTo(tempCanvas.width, y)
            tempCtx.stroke()
          }
          for (let x = 0; x <= tempCanvas.width; x += blockSize) {
            tempCtx.beginPath()
            tempCtx.moveTo(x, 0)
            tempCtx.lineTo(x, tempCanvas.height)
            tempCtx.stroke()
          }
        }

        // Scale up if needed
        if (scale > 1) {
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height)
        } else {
          ctx.drawImage(tempCanvas, 0, 0)
        }

        addWatermark(ctx, canvas.width, canvas.height)

        resolve(canvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = imgSrc
  })
}

function addWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const watermarkText = "pix.krixnx.xyz"
  const fontSize = Math.max(12, Math.floor(width / 50))

  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"

  const padding = Math.max(8, fontSize / 2)
  ctx.fillText(watermarkText, width - padding, height - padding)
}

export { COMMON_PRESETS }
