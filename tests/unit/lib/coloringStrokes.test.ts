import { describe, it, expect, vi } from 'vitest'
import {
  appendPoint,
  canUndo,
  createStroke,
  deserializeStrokes,
  getStorageKey,
  loadStrokes,
  redoStroke,
  replayStrokes,
  saveStrokes,
  serializeStrokes,
  undoStroke,
  MAX_STORED_STROKES,
  type Stroke,
} from '@/lib/coloringStrokes'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

describe('coloringStrokes', () => {
  it('builds keys ignoring query strings and scoping by session', () => {
    expect(getStorageKey('https://x/y.png?token=1')).toBe(getStorageKey('https://x/y.png?token=2'))
    expect(getStorageKey('https://x/y.png', 's1')).not.toBe(getStorageKey('https://x/y.png'))
  })

  it('creates strokes and rounds points', () => {
    const s = createStroke('#fff', 4, 1.234, 5.678)
    appendPoint(s, 2.04, 3)
    expect(s.points).toEqual([1.2, 5.7, 2, 3])
    expect(s.by).toBeUndefined()
  })

  it('round-trips serialization', () => {
    const strokes: Stroke[] = [{ color: '#000', size: 3, points: [0, 0, 1, 1] }, { color: '#f00', size: 5, points: [2, 2], by: 'u2' }]
    expect(deserializeStrokes(serializeStrokes(strokes))).toEqual(strokes)
  })

  it('tolerates corrupt, wrong-version and invalid data', () => {
    expect(deserializeStrokes(null)).toEqual([])
    expect(deserializeStrokes('{nope')).toEqual([])
    expect(deserializeStrokes('{"v":2,"strokes":[]}')).toEqual([])
    const raw = JSON.stringify({
      v: 1,
      strokes: [{ color: '#000', size: 3, points: [0, 0] }, { color: 1, size: 3, points: [0, 0] }, { color: '#000', size: 3, points: [1] }],
    })
    expect(deserializeStrokes(raw)).toHaveLength(1)
  })

  it('caps stored strokes', () => {
    const many = Array.from({ length: MAX_STORED_STROKES + 5 }, () => ({ color: '#000', size: 1, points: [0, 0] }))
    expect(deserializeStrokes(serializeStrokes(many))).toHaveLength(MAX_STORED_STROKES)
  })

  it('saves, loads and removes when empty', () => {
    const storage = memoryStorage()
    const strokes = [{ color: '#000', size: 3, points: [0, 0, 1, 1] }]
    expect(saveStrokes(storage, 'k', strokes)).toBe(true)
    expect(loadStrokes(storage, 'k')).toEqual(strokes)
    saveStrokes(storage, 'k', [])
    expect(storage.getItem('k')).toBeNull()
  })

  it('reports failure when storage throws or is missing', () => {
    const bad = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('quota') }, removeItem: () => {} }
    expect(saveStrokes(bad, 'k', [{ color: '#000', size: 1, points: [0, 0] }])).toBe(false)
    expect(loadStrokes(bad, 'k')).toEqual([])
    expect(saveStrokes(null, 'k', [])).toBe(false)
  })

  it('undoes only local strokes and redoes them', () => {
    const local = { color: '#000', size: 1, points: [0, 0] }
    const remote = { color: '#111', size: 1, points: [1, 1], by: 'u2' }
    let h = { strokes: [local, remote], redo: [] as Stroke[] }
    expect(canUndo(h.strokes)).toBe(true)
    h = undoStroke(h)
    expect(h.strokes).toEqual([remote])
    expect(h.redo).toEqual([local])
    expect(undoStroke(h)).toBe(h)
    h = redoStroke(h)
    expect(h.strokes).toEqual([remote, local])
    expect(h.redo).toEqual([])
    expect(redoStroke(h)).toBe(h)
  })

  it('replays strokes onto a context', () => {
    const ctx = {
      save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(),
      lineCap: '', lineJoin: '', strokeStyle: '', fillStyle: '', lineWidth: 0,
    }
    replayStrokes(ctx as unknown as CanvasRenderingContext2D, [
      { color: '#f00', size: 4, points: [0, 0, 5, 5, 9, 9] },
      { color: '#0f0', size: 6, points: [3, 3] },
    ])
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    expect(ctx.lineTo).toHaveBeenCalledTimes(2)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
    expect(ctx.arc).toHaveBeenCalledWith(3, 3, 3, 0, Math.PI * 2)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
  })
})
