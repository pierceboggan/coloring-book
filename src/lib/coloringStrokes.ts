export interface Stroke {
  color: string
  size: number
  /** Flat [x0, y0, x1, y1, ...] in canvas pixel coordinates */
  points: number[]
  /** Collaborator id for remote strokes; undefined for local strokes */
  by?: string
}

export interface StrokeHistory {
  strokes: Stroke[]
  redo: Stroke[]
}

interface StoredPayload {
  v: 1
  strokes: Stroke[]
}

export const STROKE_STORAGE_PREFIX = 'coloringbook:strokes:'
export const MAX_STORED_STROKES = 2000

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function getStorageKey(imageUrl: string, sessionId?: string): string {
  // Signed URLs change their query string between sessions; the path identifies the image
  const base = imageUrl.split('?')[0].split('#')[0]
  return `${STROKE_STORAGE_PREFIX}${sessionId ? `${sessionId}:` : ''}${base}`
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function createStroke(color: string, size: number, x: number, y: number, by?: string): Stroke {
  const stroke: Stroke = { color, size, points: [round1(x), round1(y)] }
  if (by) stroke.by = by
  return stroke
}

export function appendPoint(stroke: Stroke, x: number, y: number): void {
  stroke.points.push(round1(x), round1(y))
}

export function serializeStrokes(strokes: Stroke[]): string {
  const payload: StoredPayload = { v: 1, strokes: strokes.slice(-MAX_STORED_STROKES) }
  return JSON.stringify(payload)
}

function isValidStroke(value: unknown): value is Stroke {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    typeof s.color === 'string' &&
    typeof s.size === 'number' &&
    Number.isFinite(s.size) &&
    Array.isArray(s.points) &&
    s.points.length >= 2 &&
    s.points.length % 2 === 0 &&
    s.points.every(p => typeof p === 'number' && Number.isFinite(p)) &&
    (s.by === undefined || typeof s.by === 'string')
  )
}

/** Returns [] for missing, corrupt, or unknown-version data; drops invalid strokes. */
export function deserializeStrokes(raw: string | null | undefined): Stroke[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPayload>
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.strokes)) return []
    return parsed.strokes.filter(isValidStroke)
  } catch {
    return []
  }
}

export function loadStrokes(storage: StorageLike | null | undefined, key: string): Stroke[] {
  try {
    return deserializeStrokes(storage?.getItem(key))
  } catch {
    return []
  }
}

/** Returns false when persistence failed (quota, private mode, no storage). */
export function saveStrokes(storage: StorageLike | null | undefined, key: string, strokes: Stroke[]): boolean {
  if (!storage) return false
  try {
    if (strokes.length === 0) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, serializeStrokes(strokes))
    }
    return true
  } catch {
    return false
  }
}

export function replayStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    const { points } = stroke
    if (points.length < 2) continue
    if (points.length === 2) {
      ctx.fillStyle = stroke.color
      ctx.beginPath()
      ctx.arc(points[0], points[1], stroke.size / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.size
    ctx.beginPath()
    ctx.moveTo(points[0], points[1])
    for (let i = 2; i < points.length; i += 2) {
      ctx.lineTo(points[i], points[i + 1])
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** Moves the most recent local stroke (not by a collaborator) onto the redo stack. */
export function undoStroke(history: StrokeHistory): StrokeHistory {
  for (let i = history.strokes.length - 1; i >= 0; i--) {
    if (!history.strokes[i].by) {
      return {
        strokes: [...history.strokes.slice(0, i), ...history.strokes.slice(i + 1)],
        redo: [...history.redo, history.strokes[i]],
      }
    }
  }
  return history
}

export function redoStroke(history: StrokeHistory): StrokeHistory {
  if (history.redo.length === 0) return history
  return {
    strokes: [...history.strokes, history.redo[history.redo.length - 1]],
    redo: history.redo.slice(0, -1),
  }
}

export const canUndo = (strokes: Stroke[]) => strokes.some(s => !s.by)
