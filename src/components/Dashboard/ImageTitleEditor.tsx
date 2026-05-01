'use client'

import { useState } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import type { UserImage } from './types'

interface ImageTitleEditorProps {
  image: UserImage
  isSaving: boolean
  onSave: (newName: string) => Promise<void> | void
}

export function ImageTitleEditor({ image, isSaving, onSave }: ImageTitleEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(image.name)

  const startEditing = () => {
    setValue(image.name)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setValue(image.name)
  }

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      alert('Image name cannot be empty.')
      return
    }
    if (trimmed === image.name) {
      cancel()
      return
    }
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch {
      // error already surfaced inside onSave
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancel()
            }
          }}
          className="w-full rounded-full border-2 border-[#FFB3BA] px-4 py-2 text-sm font-semibold text-[#3A2E39] shadow-[4px_4px_0_0_#FF8A80] focus:outline-none focus:ring-2 focus:ring-[#FF6F91] sm:w-64"
          maxLength={120}
          aria-label="Image name"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full border-2 border-[#A0E7E5] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1DB9B3] shadow-[4px_4px_0_0_#55C6C0] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? 'Saving' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={cancel}
            className="flex items-center gap-2 rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="max-w-[14rem] truncate text-lg font-extrabold text-[#3A2E39]">{image.name}</h3>
      <button
        type="button"
        onClick={startEditing}
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FFB3BA] bg-[#FFE6EB] text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
        title="Rename"
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Rename image</span>
      </button>
    </div>
  )
}
