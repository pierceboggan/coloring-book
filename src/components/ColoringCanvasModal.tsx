'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { X, Undo2, Trash2, Download, Droplet, Sparkles } from 'lucide-react'

interface ColoringCanvasModalProps {
  imageUrl: string
  imageName: string
  onClose: () => void
}

const PRESET_COLOR = [
  '#000000',
  '#6b7280',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#ec4899',
  '#f9fafb',
]

export function ColoringCanvasModal({ imageUrl, imageName, onClose }: ColoringCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#ef4444')
  const [brushSize, setBrushSize] = useState(6)
  const [history, setHistory] = useState<string[]>([])
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const isCanvasReady = isImageLoaded && !loadError

  // Load the coloring page image onto the canvas when the modal opens
  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    contextRef.current = context
    setIsImageLoaded(false)
    setLoadError(null)

    const coloringImage = new Image()
    coloringImage.crossOrigin = 'anonymous'
    coloringImage.src = imageUrl

    coloringImage.onload = () => {
      imageRef.current = coloringImage
      canvas.width = coloringImage.naturalWidth
      canvas.height = coloringImage.naturalHeight

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(coloringImage, 0, 0, canvas.width, canvas.height)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      setIsImageLoaded(true)
      setHistory([])
    }

    coloringImage.onerror = () => {
      setLoadError('We could not load this coloring page. Please try downloading it instead.')
    }
  }, [imageUrl])

  // Handle window resizing to keep the modal scroll position at top when opened
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const getCanvasCoordinates = (event: PointerEvent | ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current

    if (!canvas) {
      return { x: 0, y: 0 }
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = 'clientX' in event ? event.clientX : 0
    const clientY = 'clientY' in event ? event.clientY : 0

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    if (!contextRef.current || !canvasRef.current || !isCanvasReady) {
      return
    }

    setHistory(prev => {
      const snapshot = canvasRef.current?.toDataURL()
      if (!snapshot) {
        return prev
      }

      const next = [...prev, snapshot]
      return next.length > 15 ? next.slice(next.length - 15) : next
    })

    const { x, y } = getCanvasCoordinates(event)

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    contextRef.current.strokeStyle = brushColor
    contextRef.current.lineWidth = brushSize
    canvasRef.current.setPointerCapture(event.pointerId)
    setIsDrawing(true)
  }

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      return
    }

    event.preventDefault()
    const { x, y } = getCanvasCoordinates(event)
    contextRef.current.lineTo(x, y)
    contextRef.current.stroke()
  }

  const stopDrawing = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      return
    }

    contextRef.current.closePath()
    setIsDrawing(false)
    if (event && canvasRef.current) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0 || !contextRef.current || !canvasRef.current) {
        return prev
      }

      const previousState = prev[prev.length - 1]
      const img = new Image()
      img.onload = () => {
        if (!contextRef.current || !canvasRef.current) {
          return
        }

        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        contextRef.current.drawImage(img, 0, 0)
      }
      img.src = previousState

      return prev.slice(0, prev.length - 1)
    })
  }

  const handleClear = () => {
    if (!contextRef.current || !canvasRef.current || !imageRef.current || !isCanvasReady) {
      return
    }

    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    contextRef.current.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory([])
  }

  const handleDownload = () => {
    const canvas = canvasRef.current

    if (!canvas || !isCanvasReady) {
      return
    }

    const link = document.createElement('a')
    link.download = `${imageName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_colored.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E39]/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl">
        <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#A0E7E5]/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.75rem] border-4 border-[#A0E7E5] bg-[#FFF5D6]/95 shadow-[20px_20px_0_0_#55C6C0]">
          <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/80 px-8 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">
                <Sparkles className="h-4 w-4" />
                Coloring studio
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-[#3A2E39]">Color your page</h2>
              <p className="text-sm font-medium text-[#594144]">Use the brush controls below to add color and download your finished artwork.</p>
            </div>
            <button
              onClick={onClose}
              className="self-start rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5 md:self-auto"
              aria-label="Close coloring canvas"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-6 overflow-hidden px-8 py-6 lg:flex-row">
            <div className="flex flex-1 items-center justify-center overflow-auto rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA]/80 p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className={`rounded-[1.5rem] border-4 border-[#A0E7E5]/70 bg-white ${
                    isCanvasReady ? '' : 'pointer-events-none opacity-0'
                  }`}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  onPointerCancel={stopDrawing}
                />
                {!isCanvasReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[1.5rem] border-4 border-dashed border-[#FFD166] bg-[#FFF3BF]/80 p-6 text-center text-sm font-semibold text-[#AA6A00]">
                    {loadError ? (
                      <>
                        <p className="mb-2 text-[#3A2E39]">{loadError}</p>
                        <p className="text-xs font-medium text-[#AA6A00]">If this keeps happening, use the download button on your dashboard card.</p>
                      </>
                    ) : (
                      <p>Loading coloring page...</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-5 rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-5 lg:w-72">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#FF6F91]">Brush color</h3>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLOR.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBrushColor(color)}
                      style={{ backgroundColor: color }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                        brushColor === color ? 'border-[#3A2E39] ring-2 ring-offset-1 ring-[#3A2E39]' : 'border-white shadow-[3px_3px_0_0_rgba(0,0,0,0.08)]'
                      }`}
                      aria-label={`Select ${color} brush`}
                    >
                      {color === '#f9fafb' && <Droplet className="h-4 w-4 text-[#BFA3B7]" />}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#AA6A00]">Custom:</label>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-full border-2 border-white shadow-[3px_3px_0_0_rgba(0,0,0,0.08)]"
                    aria-label="Pick custom brush color"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-[#AA6A00]" htmlFor="brush-size">
                  Brush size
                </label>
                <input
                  id="brush-size"
                  type="range"
                  min={2}
                  max={30}
                  value={brushSize}
                  onChange={event => setBrushSize(Number(event.target.value))}
                  className="w-full accent-[#FF6F91]"
                />
                <div className="mt-1 text-xs font-semibold text-[#AA6A00]">{brushSize}px</div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0 || !isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-white px-4 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo last stroke
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFD166] bg-[#FFF3BF] px-4 py-3 text-sm font-semibold text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear canvas
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFB3BA] bg-[#FF6F91] px-4 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#f2557b] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Download className="h-4 w-4" />
                  Download artwork
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

