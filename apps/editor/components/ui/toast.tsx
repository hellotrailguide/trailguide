'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// Simple global toast state
let toasts: Toast[] = []
let listeners: Set<() => void> = new Set()

function notifyListeners() {
  listeners.forEach(listener => listener())
}

export const toast = {
  success: (message: string, duration = 3000) => {
    const id = Date.now().toString()
    toasts = [...toasts, { id, message, type: 'success', duration }]
    notifyListeners()
    if (duration > 0) {
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id)
        notifyListeners()
      }, duration)
    }
  },
  error: (message: string, duration = 5000) => {
    const id = Date.now().toString()
    toasts = [...toasts, { id, message, type: 'error', duration }]
    notifyListeners()
    if (duration > 0) {
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id)
        notifyListeners()
      }, duration)
    }
  },
  info: (message: string, duration = 3000) => {
    const id = Date.now().toString()
    toasts = [...toasts, { id, message, type: 'info', duration }]
    notifyListeners()
    if (duration > 0) {
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id)
        notifyListeners()
      }, duration)
    }
  },
}

function useToasts() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return toasts
}

export function ToastContainer() {
  const currentToasts = useToasts()

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {currentToasts.map(t => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-[400px]
            animate-in slide-in-from-right-5 fade-in duration-200
            ${t.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : ''}
            ${t.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : ''}
            ${t.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : ''}
          `}
        >
          {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
          {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
          {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          <span className="text-sm flex-1">{t.message}</span>
          <button
            onClick={() => {
              toasts = toasts.filter(x => x.id !== t.id)
              notifyListeners()
            }}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
