"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastItem = {
  id: string
  message: string
}

type ToastContextValue = {
  toast: (message: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((message: string) => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, message }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport items={items} onDismiss={(id) => setItems((prev) => prev.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed right-4 bottom-4 z-100 flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-2 rounded-xl border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"
          )}
          role="status"
          aria-live="polite"
        >
          <p className="min-w-0 flex-1">{t.message}</p>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  )
}

