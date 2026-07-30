/**
 * AvatarUpload — click to upload a profile picture.
 * Shows current avatar with an upload overlay on hover.
 */
import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { uploadFile } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface Props {
  currentUrl?: string | null
  name?: string
  onUploaded: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
}

export function AvatarUpload({ currentUrl, name, onUploaded, size = 'lg', disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const displayUrl = preview ?? currentUrl

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview immediately
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onUploaded(url)
      toast({ title: 'Profile picture updated', variant: 'success' })
    } catch (err) {
      setPreview(null)
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'error' })
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden cursor-pointer group',
        SIZE_CLASSES[size],
        (disabled || uploading) && 'cursor-not-allowed',
      )}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      title="Click to change profile picture"
    >
      {/* Avatar image or initials */}
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={name ?? 'Profile picture'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-primary text-white flex items-center justify-center text-lg font-bold font-serif">
          {initials ?? 'U'}
        </div>
      )}

      {/* Overlay */}
      <div className={cn(
        'absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 transition-opacity',
        uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
      )}>
        {uploading ? (
          <Loader2 size={18} className="text-white animate-spin" />
        ) : (
          <>
            <Camera size={16} className="text-white" />
            <span className="text-[10px] text-white font-semibold">Change</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFile}
      />
    </div>
  )
}
