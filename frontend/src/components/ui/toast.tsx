/**
 * Lightweight toast — no Radix dependency needed.
 * Usage: import { useToast } from '@/components/ui/toast'
 *        const { toast } = useToast()
 *        toast({ title: 'Saved!', variant: 'success' })
 */
import { createContext, useCallback, useContext, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'default' | 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: Variant
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<Variant, React.ReactNode> = {
  default: <Info size={16} />,
  success: <CheckCircle2 size={16} className="text-emerald-600" />,
  error: <AlertCircle size={16} className="text-destructive" />,
  info: <Info size={16} className="text-blue-500" />,
}

const STYLES: Record<Variant, string> = {
  default: 'bg-white border-border',
  success: 'bg-white border-emerald-200',
  error: 'bg-white border-destructive/30',
  info: 'bg-white border-blue-200',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { ...t, id }]) // max 5 visible
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Portal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3',
              'animate-in slide-in-from-bottom-2 fade-in duration-200',
              STYLES[t.variant ?? 'default'],
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.variant ?? 'default']}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
