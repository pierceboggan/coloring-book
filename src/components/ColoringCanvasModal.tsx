'use client'

import React, { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { X, Undo2, Redo2, Trash2, Download, Droplet, Sparkles, Check } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  appendPoint,
  canUndo,
  createStroke,
  getStorageKey,
  loadStrokes,
  redoStroke,
  replayStrokes,
  saveStrokes,
  undoStroke,
  type Stroke,
} from '@/lib/coloringStrokes'

interface ColoringCanvasModalProps {
  imageUrl: string
  imageName: string
  onClose: () => void
  collaboration?: {
    sessionId: string
    userId: string
  }
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

export function ColoringCanvasModal({ imageUrl, imageName, onClose, collaboration }: ColoringCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#ef4444')
  const [brushSize, setBrushSize] = useState(6)
  const strokesRef = useRef<Stroke[]>([])
  const redoRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const remoteStrokesRef = useRef(new Map<string, Stroke>())
  const [historyFlags, setHistoryFlags] = useState({ canUndo: false, canRedo: false, hasStrokes: false })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'unavailable'>('idle')
  const storageKey = getStorageKey(imageUrl, collaboration?.sessionId)
  const storageKeyRef = useRef(storageKey)
  storageKeyRef.current = storageKey
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({})
  const isCanvasReady = isImageLoaded && !loadError

  const collabChannelRef = useRef<RealtimeChannel | null>(null)
  const remoteDrawingRef = useRef(
    new Map<string, { color: string; size: number; isDrawing: boolean }>()
  )
  const [collabParticipantCount, setCollabParticipantCount] = useState<number | null>(null)

  const getStorage = () => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage
    } catch {
      return null
    }
  }

  const syncHistoryFlags = () => {
    setHistoryFlags({
      canUndo: canUndo(strokesRef.current),
      canRedo: redoRef.current.length > 0,
      hasStrokes: strokesRef.current.length > 0,
    })
  }

  const persistStrokes = () => {
    const ok = saveStrokes(getStorage(), storageKeyRef.current, strokesRef.current)
    setSaveStatus(ok ? 'saved' : 'unavailable')
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context || !imageRef.current) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    replayStrokes(context, strokesRef.current)
  }

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

      // Compute CSS display size to fit within the visible area while preserving aspect ratio
      const MAX_W = 700
      const MAX_H = Math.min(window.innerHeight - 220, 580)
      const ratio = coloringImage.naturalWidth / coloringImage.naturalHeight
      let displayW = coloringImage.naturalWidth
      let displayH = coloringImage.naturalHeight
      if (displayW > MAX_W) { displayW = MAX_W; displayH = displayW / ratio }
      if (displayH > MAX_H) { displayH = MAX_H; displayW = displayH * ratio }
      setCanvasStyle({ width: `${Math.round(displayW)}px`, height: `${Math.round(displayH)}px` })

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.lineCap = 'round'
      context.lineJoin = 'round'

      // Resume saved progress for this image by replaying its strokes
      strokesRef.current = loadStrokes(getStorage(), storageKeyRef.current)
      redoRef.current = []
      currentStrokeRef.current = null
      remoteStrokesRef.current.clear()
      redrawCanvas()
      setSaveStatus(strokesRef.current.length > 0 ? 'saved' : 'idle')
      syncHistoryFlags()
      setIsImageLoaded(true)
    }

    coloringImage.onerror = () => {
      setLoadError('We could not load this coloring page. Please try downloading it instead.')
    }
  }, [imageUrl])

  useEffect(() => {
    if (!collaboration?.sessionId || !collaboration.userId) {
      return
    }

    const channel = supabase.channel(`collab:${collaboration.sessionId}`)
    collabChannelRef.current = channel
    const remoteDrawing = remoteDrawingRef.current

    const updatePresenceCount = () => {
      const state = channel.presenceState() as Record<string, Array<{ userId?: string }>>
      const ids = new Set<string>()
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.userId) {
            ids.add(entry.userId)
          }
        })
      })
      setCollabParticipantCount(ids.size)
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePresenceCount()
      })
      .on('presence', { event: 'join' }, () => {
        updatePresenceCount()
      })
      .on('presence', { event: 'leave' }, () => {
        updatePresenceCount()
      })
      .on(
        'broadcast',
        { event: 'stroke' },
        (payload: { payload: unknown }) => {
          const incoming = payload.payload as {
            type: 'start' | 'move' | 'end'
            userId: string
            x?: number
            y?: number
            color?: string
            size?: number
          }

          if (!contextRef.current || !canvasRef.current || !isCanvasReady) {
            return
          }

          if (incoming.userId === collaboration.userId) {
            return
          }

          const remoteState = remoteDrawingRef.current.get(incoming.userId) ?? {
            color: incoming.color ?? '#000000',
            size: incoming.size ?? 6,
            isDrawing: false,
          }

          if (incoming.type === 'start' && typeof incoming.x === 'number' && typeof incoming.y === 'number') {
            remoteState.color = incoming.color ?? remoteState.color
            remoteState.size = incoming.size ?? remoteState.size
            remoteState.isDrawing = true
            remoteDrawingRef.current.set(incoming.userId, remoteState)

            contextRef.current.beginPath()
            contextRef.current.moveTo(incoming.x, incoming.y)
            contextRef.current.strokeStyle = remoteState.color
            contextRef.current.lineWidth = remoteState.size

            const remoteStroke = createStroke(remoteState.color, remoteState.size, incoming.x, incoming.y, incoming.userId)
            remoteStrokesRef.current.set(incoming.userId, remoteStroke)
            strokesRef.current.push(remoteStroke)
            return
          }

          if (incoming.type === 'move' && remoteState.isDrawing && typeof incoming.x === 'number' && typeof incoming.y === 'number') {
            contextRef.current.strokeStyle = remoteState.color
            contextRef.current.lineWidth = remoteState.size
            contextRef.current.lineTo(incoming.x, incoming.y)
            contextRef.current.stroke()
            remoteDrawingRef.current.set(incoming.userId, remoteState)
            const remoteStroke = remoteStrokesRef.current.get(incoming.userId)
            if (remoteStroke) {
              appendPoint(remoteStroke, incoming.x, incoming.y)
            }
            return
          }

          if (incoming.type === 'end') {
            remoteState.isDrawing = false
            remoteDrawingRef.current.set(incoming.userId, remoteState)
            contextRef.current.closePath()
            if (remoteStrokesRef.current.delete(incoming.userId)) {
              syncHistoryFlags()
              persistStrokes()
            }
          }
        }
      )
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: collaboration.userId })
          updatePresenceCount()
        }
      })

    return () => {
      remoteDrawing.clear()
      setCollabParticipantCount(null)
      collabChannelRef.current?.unsubscribe()
      collabChannelRef.current = null
    }
  }, [collaboration?.sessionId, collaboration?.userId, isCanvasReady])

  // Flush progress if the modal closes mid-stroke
  useEffect(() => {
    return () => {
      if (strokesRef.current.length > 0) {
        saveStrokes(getStorage(), storageKeyRef.current, strokesRef.current)
      }
    }
  }, [])

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

    const { x, y } = getCanvasCoordinates(event)

    const stroke = createStroke(brushColor, brushSize, x, y)
    currentStrokeRef.current = stroke
    strokesRef.current.push(stroke)
    redoRef.current = []
    syncHistoryFlags()

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    contextRef.current.strokeStyle = brushColor
    contextRef.current.lineWidth = brushSize
    canvasRef.current.setPointerCapture(event.pointerId)
    setIsDrawing(true)

    if (collaboration?.sessionId && collaboration.userId) {
      collabChannelRef.current?.send({
        type: 'broadcast',
        event: 'stroke',
        payload: {
          type: 'start',
          userId: collaboration.userId,
          x,
          y,
          color: brushColor,
          size: brushSize,
        },
      })
    }
  }

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      return
    }

    event.preventDefault()
    const { x, y } = getCanvasCoordinates(event)
    contextRef.current.lineTo(x, y)
    contextRef.current.stroke()
    if (currentStrokeRef.current) {
      appendPoint(currentStrokeRef.current, x, y)
    }

    if (collaboration?.sessionId && collaboration.userId) {
      collabChannelRef.current?.send({
        type: 'broadcast',
        event: 'stroke',
        payload: {
          type: 'move',
          userId: collaboration.userId,
          x,
          y,
        },
      })
    }
  }

  const stopDrawing = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      return
    }

    contextRef.current.closePath()
    setIsDrawing(false)
    if (currentStrokeRef.current) {
      // A click without movement is replayed as a dot
      currentStrokeRef.current = null
      persistStrokes()
    }
    if (event && canvasRef.current) {
      canvasRef.current.releasePointerCapture(event.pointerId)
    }

    if (collaboration?.sessionId && collaboration.userId) {
      collabChannelRef.current?.send({
        type: 'broadcast',
        event: 'stroke',
        payload: {
          type: 'end',
          userId: collaboration.userId,
        },
      })
    }
  }

  const applyHistory = (next: { strokes: Stroke[]; redo: Stroke[] }) => {
    strokesRef.current = next.strokes
    redoRef.current = next.redo
    redrawCanvas()
    syncHistoryFlags()
    persistStrokes()
  }

  const handleUndo = () => {
    if (!isCanvasReady || isDrawing) {
      return
    }
    applyHistory(undoStroke({ strokes: strokesRef.current, redo: redoRef.current }))
  }

  const handleRedo = () => {
    if (!isCanvasReady || isDrawing) {
      return
    }
    applyHistory(redoStroke({ strokes: strokesRef.current, redo: redoRef.current }))
  }

  const handleStartOver = () => {
    if (!isCanvasReady || !imageRef.current) {
      return
    }
    if (typeof window !== 'undefined' && !window.confirm('Start over? This erases all your coloring on this page.')) {
      return
    }
    currentStrokeRef.current = null
    setIsDrawing(false)
    applyHistory({ strokes: [], redo: [] })
    setSaveStatus('idle')
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
      <div className="relative w-full max-w-5xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#A0E7E5]/40 blur-2xl" aria-hidden="true" />
        <div className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden rounded-[2.75rem] border-4 border-[#A0E7E5] bg-[#FFF5D6]/95 shadow-[20px_20px_0_0_#55C6C0]">
          <div className="flex shrink-0 flex-col gap-2 border-b-4 border-dashed border-[#FFB3BA] bg-[#FFE6EB]/80 px-8 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">
                <Sparkles className="h-4 w-4" />
                Coloring studio
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[#3A2E39]">Color your page</h2>
            </div>
            {saveStatus !== 'idle' && (
              <div
                role="status"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#1DB9B3]"
              >
                {saveStatus === 'saved' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Progress saved
                  </>
                ) : (
                  <span className="text-[#AA6A00]">Couldn&apos;t save progress</span>
                )}
              </div>
            )}
            {collaboration?.sessionId && collabParticipantCount !== null && (
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-[#E0F7FA] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#1DB9B3] shadow-[4px_4px_0_0_#55C6C0]">
                {collabParticipantCount} artists online
              </div>
            )}
            <button
              onClick={onClose}
              className="self-start rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5 md:self-auto"
              aria-label="Close coloring canvas"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden px-8 py-6 lg:flex-row">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-[2rem] border-4 border-[#A0E7E5] bg-[#E0F7FA]/80 p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  style={canvasStyle}
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

            <div className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto rounded-[2rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-5 lg:w-72 lg:shrink-0">
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
                  disabled={!historyFlags.canUndo || !isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-white px-4 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo last stroke
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!historyFlags.canRedo || !isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-white px-4 py-3 text-sm font-semibold text-[#1DB9B3] shadow-[6px_6px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Redo2 className="h-4 w-4" />
                  Redo stroke
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  disabled={!historyFlags.hasStrokes || !isCanvasReady}
                  className="flex items-center justify-center gap-2 rounded-full border-4 border-[#FFD166] bg-[#FFF3BF] px-4 py-3 text-sm font-semibold text-[#AA6A00] shadow-[6px_6px_0_0_#FFB84C] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  <Trash2 className="h-4 w-4" />
                  Start over
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

