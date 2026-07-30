/**
 * ImageUpload — drag-and-drop + click to upload images.
 * Uploads immediately to POST /api/v1/upload and returns the server URL.
 * Supports single or multiple images with reordering and primary selection.
 */
import { useRef, useState, useCallback } from 'react'
import { Upload, X, Star, Loader2, ImagePlus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { uploadFile } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export interface UploadedImage {
  url: string
  isPrimary: boolean
  position: number
}

interface Props {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({ images, onChange, maxImages = 8, disabled = false }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const canAddMore = images.length < maxImages

  async function handleFiles(files: FileList | null) {
    if (!files || !canAddMore) return
    const toProcess = Array.from(files).slice(0, maxImages - images.length)
    setUploading(true)

    const results: UploadedImage[] = []
    for (const file of toProcess) {
      try {
        const url = await uploadFile(file)
        results.push({
          url,
          isPrimary: images.length === 0 && results.length === 0,
          position: images.length + results.length,
        })
      } catch {
        toast({ title: `Failed to upload ${file.name}`, variant: 'error' })
      }
    }

    if (results.length > 0) {
      const updated = [...images, ...results]
      // Ensure exactly one primary
      if (!updated.some((i) => i.isPrimary)) updated[0]!.isPrimary = true
      onChange(updated)
    }
    setUploading(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  function setPrimary(idx: number) {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === idx })))
  }

  function remove(idx: number) {
    const updated = images
      .filter((_, i) => i !== idx)
      .map((img, i) => ({ ...img, position: i }))
    // Re-assign primary if we removed it
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0]!.isPrimary = true
    }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Uploaded previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={cn(
                'relative group rounded-xl overflow-hidden border-2 aspect-square bg-muted',
                img.isPrimary ? 'border-primary' : 'border-border hover:border-primary/40',
              )}
            >
              <img
                src={img.url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    title="Set as primary"
                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition"
                  >
                    <Star size={14} className="text-amber-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  title="Remove"
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-destructive hover:text-white transition"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> Primary
                </div>
              )}
              {/* Position number */}
              <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
            'min-h-[120px] px-6 py-8',
            dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5',
            (disabled || uploading) && 'opacity-60 cursor-not-allowed',
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={28} className="text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImagePlus size={22} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Drop images here or <span className="text-primary">click to browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP — max 8 MB each · {images.length}/{maxImages} uploaded
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  )
}
