'use client'

import { Sparkles } from 'lucide-react'
import { ImageUploader } from './dynamicModals'

interface UploaderModalProps {
  onClose: () => void
  onUploadComplete: () => void
}

export function UploaderModal({ onClose, onUploadComplete }: UploaderModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3A2E39]/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-[#FFB3BA]/40 via-[#FFD166]/40 to-[#9BF6FF]/40 blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#FFB3BA] bg-[#FFF5D6]/95 p-6 shadow-[8px_8px_0_0_#FF8A80]">
            <div className="max-h-[90vh] overflow-y-auto pr-2 sm:pr-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#FFD166] bg-[#FFF3BF] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#E97777]">
                    <Sparkles className="h-3 w-3" />
                    Upload station
                  </p>
                  <h2 className="mt-3 text-2xl font-extrabold text-[#3A2E39]">Upload Photos</h2>
                  <p className="text-sm font-medium text-[#594144]">Drop in your favorite snapshots and we will turn them into coloring adventures.</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-2 text-[#FF6F91] shadow-[4px_4px_0_0_#FF8A80] transition-transform hover:-translate-y-0.5"
                  aria-label="Close uploader"
                >
                  ✕
                </button>
              </div>
              <div className="mt-5">
                <ImageUploader onUploadComplete={onUploadComplete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
