'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { X, Undo2, Trash2, Download, Droplet } from 'lucide-react'

interface ColoringCanvasModalProps {
  imageUrl: string
  imageName: string
  onClose: () => void
}

const PRESET_COLORS = [
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Color your page</h2>
            <p className="text-sm text-gray-500">Use the brush controls below to add color and download your finished artwork.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close coloring canvas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-4 sm:flex-row">
          <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
            <div className="relative w-full max-w-full">
              <canvas
                ref={canvasRef}
                className={`h-full w-full max-h-[70vh] rounded-lg border border-gray-200 bg-white object-contain ${
                  isCanvasReady ? '' : 'pointer-events-none opacity-0'
                }`}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                onPointerCancel={stopDrawing}
              />
              {!isCanvasReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-white/80 p-6 text-center text-sm text-gray-600">
                  {loadError ? (
                    <>
                      <p className="mb-2 font-medium text-gray-700">{loadError}</p>
                      <p>If this keeps happening, use the download button on your dashboard card.</p>
                    </>
                  ) : (
                    <p>Loading coloring page...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:w-64">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Brush color</h3>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBrushColor(color)}
                    style={{ backgroundColor: color }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      brushColor === color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900' : 'border-white shadow'
                    }`}
                    aria-label={`Select ${color} brush`}
                  >
                    {color === '#f9fafb' && <Droplet className="h-4 w-4 text-gray-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="brush-size">
                Brush size
              </label>
              <input
                id="brush-size"
                type="range"
                min={2}
                max={30}
                value={brushSize}
                onChange={event => setBrushSize(Number(event.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-xs text-gray-500">{brushSize}px</div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0 || !isCanvasReady}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition enabled:hover:border-gray-300 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" />
                Undo last stroke
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!isCanvasReady}
                className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear canvas
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!isCanvasReady}
                className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
              >
                <Download className="h-4 w-4" />
                Download artwork
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

