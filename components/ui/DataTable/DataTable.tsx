'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { DataTableProps } from './types'
import { cn } from '@/lib/utils/cn'

const DEFAULT_MIN = 60
const RESIZE_HANDLE_WIDTH = 6

function getAlignClass(align?: 'left' | 'center' | 'right') {
  switch (align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
}

export function DataTable({
  columns,
  onColumnWidthsChange,
  columnWidths: controlledWidths,
  storageKey,
  minTableWidth = 900,
  fillContainer = true,
  children,
  footer,
  className,
  tableClassName,
}: DataTableProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const getInitialWidths = useCallback(() => {
    if (controlledWidths && controlledWidths.length === columns.length) return controlledWidths
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as number[]
          if (Array.isArray(parsed) && parsed.length === columns.length) return parsed
        }
      } catch {}
    }
    return columns.map((col) => col.width ?? (col.minWidth ?? DEFAULT_MIN))
  }, [columns, controlledWidths, storageKey])

  const [widths, setWidths] = useState<number[]>(getInitialWidths)
  const widthsRef = useRef(widths)
  widthsRef.current = widths
  const [resizingIndex, setResizingIndex] = useState<number | null>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // 외부에서 columnWidths가 바뀌면 동기화
  useEffect(() => {
    if (controlledWidths && controlledWidths.length === columns.length) {
      setWidths(controlledWidths)
    }
  }, [controlledWidths, columns.length])

  // storageKey가 있으면 로드
  useEffect(() => {
    if (!storageKey || controlledWidths) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as number[]
        if (Array.isArray(parsed) && parsed.length === columns.length) setWidths(parsed)
      }
    } catch {}
  }, [storageKey, columns.length, controlledWidths])

  const persistWidths = useCallback(
    (next: number[]) => {
      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {}
      }
      onColumnWidthsChange?.(next)
    },
    [storageKey, onColumnWidthsChange]
  )

  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    setResizingIndex(index)
    startXRef.current = e.clientX
    startWidthRef.current = widths[index] ?? DEFAULT_MIN
  }

  useEffect(() => {
    if (resizingIndex === null) return

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      const minW = columns[resizingIndex]?.minWidth ?? DEFAULT_MIN

      if (fillContainer && wrapperRef.current) {
        const currentWidths = widthsRef.current
        const total = currentWidths.reduce((a, b) => a + b, 0)
        const containerWidth = wrapperRef.current.clientWidth
        if (containerWidth <= 0) return
        const weightDelta = (delta / containerWidth) * total
        const nextIndex = resizingIndex + 1
        setWidths((prev) => {
          const next = [...prev]
          next[resizingIndex] = prev[resizingIndex] + weightDelta
          if (nextIndex < prev.length) next[nextIndex] = prev[nextIndex] - weightDelta
          const nextMin = columns[nextIndex]?.minWidth ?? DEFAULT_MIN
          next[resizingIndex] = Math.max(minW, next[resizingIndex])
          if (nextIndex < next.length) next[nextIndex] = Math.max(nextMin, next[nextIndex])
          return next
        })
      } else {
        let newW = Math.max(minW, startWidthRef.current + delta)
        setWidths((prev) => {
          const next = [...prev]
          next[resizingIndex] = newW
          return next
        })
      }
    }

    const onUp = () => {
      setWidths((prev) => {
        persistWidths(prev)
        return prev
      })
      setResizingIndex(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizingIndex, columns, persistWidths, fillContainer])

  const total = widths.reduce((a, b) => a + b, 0) || 1
  const tableWidth = fillContainer ? undefined : Math.max(minTableWidth, total)

  return (
    <div
      ref={wrapperRef}
      className={cn('w-full min-w-0', fillContainer ? '' : 'overflow-x-auto', className)}
    >
      <table
        className={cn('w-full table-fixed divide-y divide-slate-100', tableClassName)}
        style={fillContainer ? { width: '100%' } : { minWidth: `${tableWidth}px`, width: `${tableWidth}px` }}
      >
        <colgroup>
          {widths.map((w, i) =>
            fillContainer ? (
              <col key={columns[i]?.key ?? i} style={{ width: `${(w / total) * 100}%` }} />
            ) : (
              <col key={columns[i]?.key ?? i} style={{ width: `${w}px`, minWidth: `${w}px` }} />
            )
          )}
        </colgroup>
        <thead className="bg-slate-100 border-b-2 border-slate-300 text-slate-700">
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={cn(
                  'relative px-2 py-2 text-xs font-semibold select-none',
                  getAlignClass(col.align)
                )}
              >
                {col.label}
                <div
                  role="separator"
                  aria-orientation="vertical"
                  onMouseDown={(e) => handleResizeStart(i, e)}
                  className={cn(
                    'absolute top-0 bottom-0 right-0 w-1 cursor-col-resize hover:bg-blue-300',
                    resizingIndex === i && 'bg-blue-500'
                  )}
                  style={{ right: -RESIZE_HANDLE_WIDTH / 2, width: RESIZE_HANDLE_WIDTH }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
        {footer && <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-700">{footer}</tfoot>}
      </table>
    </div>
  )
}

export type { DataTableProps, DataTableColumn } from './types'
