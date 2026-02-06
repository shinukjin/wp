'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import Pagination from '@/components/ui/Pagination'

/** 확인/취소를 눌 때까지 열려 있는 날짜·시간 선택기 (팝오버는 body 포탈로 렌더링해 스크롤 방지) */
function DateTimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const openPicker = () => {
    const base = value || ''
    const normalized =
      base.length >= 16
        ? base.slice(0, 14) + normalizeMinute(base.slice(14, 16))
        : base
    setDraft(normalized)
    setOpen(true)
  }

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const el = triggerRef.current
    const rect = el.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [open])

  /** 분을 15분 단위(00, 15, 30, 45)로 맞춤 */
  const normalizeMinute = (m: string) => {
    const n = parseInt(m, 10)
    if (Number.isNaN(n) || n < 0) return '00'
    const rounded = Math.round(n / 15) * 15
    return String(rounded === 60 ? 0 : rounded).padStart(2, '0')
  }

  const datePart = draft.slice(0, 10) || ''
  const hour = draft.length >= 13 ? draft.slice(11, 13) : ''
  const minute = draft.length >= 16 ? normalizeMinute(draft.slice(14, 16)) : ''

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setDraft(date ? date + (draft.length >= 11 ? draft.slice(10) : '') : '')
  }
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = e.target.value
    if (!h) {
      setDraft(draft.slice(0, 10) || '')
      return
    }
    const dateBase = draft.slice(0, 10) || toDatetimeLocal(new Date().toISOString()).slice(0, 10)
    setDraft(dateBase + 'T' + h + ':' + (minute || '00'))
  }
  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = e.target.value
    if (!m) {
      setDraft(draft.length >= 13 ? draft.slice(0, 13) : draft.slice(0, 10) || '')
      return
    }
    const base = draft.slice(0, 14) || (draft.slice(0, 10) ? draft.slice(0, 10) + 'T' + (hour || '00') + ':' : '')
    const fallback = toDatetimeLocal(new Date().toISOString()).slice(0, 14)
    setDraft((base || fallback) + m)
  }

  const handleConfirm = () => {
    onChange(draft)
    setOpen(false)
  }
  const handleCancel = () => {
    setOpen(false)
  }

  const popoverContent = open && typeof document !== 'undefined' && (
    <div
      className="fixed z-[9999] min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label="날짜와 시간 선택"
    >
      <div className="space-y-2">
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">날짜</label>
          <input
            type="date"
            value={datePart}
            onChange={handleDateChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">시간</label>
          <div className="flex gap-1.5">
            <select
              value={hour}
              onChange={handleHourChange}
              className={inputClass}
              aria-label="시"
            >
              <option value="">시</option>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}시
                </option>
              ))}
            </select>
            <select
              value={minute}
              onChange={handleMinuteChange}
              className={inputClass}
              aria-label="분"
            >
              <option value="">분</option>
              {[0, 15, 30, 45].map((i) => (
                <option key={i} value={String(i).padStart(2, '0')}>
                  {String(i).padStart(2, '0')}분
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-1.5 pt-2">
          <button type="button" onClick={handleCancel} className={cn(btnClass, 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50')}>
            취소
          </button>
          <button type="button" onClick={handleConfirm} className={cn(btnClass, 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700')}>
            확인
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        className={cn(
          'w-full min-w-0 px-2 py-1 text-xs text-left border border-gray-300 rounded bg-white whitespace-nowrap',
          'hover:border-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
        )}
      >
        {value ? formatDateTime(value) : '날짜·시간 선택'}
      </button>
      {popoverContent && createPortal(popoverContent, document.body)}
    </div>
  )
}

interface TravelSchedule {
  id: string
  title: string
  dueDate: string | null
  note: string | null
  remindEnabled?: boolean
}

type NewRow = {
  title: string
  dueDate: string
  note: string
  remindEnabled: boolean
}

/** ISO 또는 YYYY-MM-DDTHH:mm → datetime-local 입력용 문자열 */
function toDatetimeLocal(isoOrLocal: string): string {
  const d = new Date(isoOrLocal)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const defaultNewRow = (): NewRow => {
  return {
    title: '',
    dueDate: '',
    note: '',
    remindEnabled: true,
  }
}

const inputClass = 'w-full min-w-0 px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400'
const btnClass = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded border transition-colors'

const DEFAULT_PAGE_SIZE = 10

interface TravelScheduleTableProps {
  /** 캘린더에서 선택한 날짜(YYYY-MM-DD). 이 날짜가 포함된 일정 행을 강조 */
  highlightDate?: string | null
  /** 페이지당 행 수 (기본 10) */
  pageSize?: number
  /** 일정 저장/삭제 후 호출 (캘린더·사이드바 리프레시용) */
  onScheduleChange?: () => void
  /** 제목·내용 검색어 (캘린더 건수와 동기화) */
  searchQuery?: string
}

export default function TravelScheduleTable({ highlightDate, pageSize: pageSizeProp, onScheduleChange, searchQuery = '' }: TravelScheduleTableProps = {}) {
  const { isAuthenticated } = useWeddingStore()
  const pageSize = pageSizeProp ?? DEFAULT_PAGE_SIZE
  const [items, setItems] = useState<TravelSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<NewRow>(defaultNewRow())
  const [newItems, setNewItems] = useState<NewRow[]>([])

  const searchTrim = (searchQuery || '').trim().toLowerCase()
  const filteredItems = searchTrim
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(searchTrim) ||
          (i.note != null && i.note.toLowerCase().includes(searchTrim))
      )
    : items

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/travel-schedule')
      setItems(response.data.items || [])
    } catch (error: any) {
      console.error('Failed to fetch schedules:', error)
      alert(error.response?.data?.error || '일정을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems()
    }
  }, [isAuthenticated])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [currentPage, totalPages])

  // 캘린더에서 날짜 선택 시, 해당 날짜의 첫 번째 행이 있는 페이지로 이동 (겹치면 첫 번째 값 기준)
  useEffect(() => {
    if (!highlightDate) return
    const firstIndex = filteredItems.findIndex(
      (item) => item.dueDate && item.dueDate.slice(0, 10) === highlightDate
    )
    if (firstIndex >= 0) {
      const page = Math.floor(firstIndex / pageSize) + 1
      setCurrentPage(page)
    }
  }, [highlightDate])

  const handleAddNewItem = useCallback(() => {
    setNewItems((prev) => [...prev, defaultNewRow()])
  }, [])

  const handleUpdateNewItem = useCallback((index: number, data: Partial<NewRow>) => {
    setNewItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...data } : row))
    )
  }, [])

  const handleEdit = (item: TravelSchedule) => {
    setEditFormData({
      title: item.title,
      dueDate: item.dueDate ? toDatetimeLocal(item.dueDate) : '',
      note: item.note || '',
      remindEnabled: item.remindEnabled !== false,
    })
    setEditingId(item.id)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editFormData.title) {
      alert('일정 제목을 입력해주세요.')
      return
    }
    try {
      await apiClient.put(`/travel-schedule/${editingId}`, {
        title: editFormData.title,
        dueDate: editFormData.dueDate || null,
        note: editFormData.note || null,
        remindEnabled: editFormData.remindEnabled,
      })
      setEditingId(null)
      setEditFormData(defaultNewRow())
      fetchItems()
      onScheduleChange?.()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData(defaultNewRow())
  }

  const handleSaveSingleNew = async (index: number) => {
    const row = newItems[index]
    if (!row.title) {
      alert('일정 제목을 입력해주세요.')
      return
    }
    try {
      await apiClient.post('/travel-schedule', {
        title: row.title,
        dueDate: row.dueDate || null,
        note: row.note || null,
        remindEnabled: row.remindEnabled,
      })
      setNewItems((prev) => prev.filter((_, i) => i !== index))
      fetchItems()
      onScheduleChange?.()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  const handleBatchSave = async () => {
    const valid = newItems.filter((row) => row.title)
    const invalid = newItems.length - valid.length
    if (invalid > 0) {
      alert(`${invalid}개 행에 일정 제목을 입력해주세요.`)
      return
    }
    if (valid.length === 0) return
    try {
      await Promise.all(
        valid.map((row) =>
          apiClient.post('/travel-schedule', {
            title: row.title,
            dueDate: row.dueDate || null,
            note: row.note || null,
            remindEnabled: row.remindEnabled,
          })
        )
      )
      setNewItems([])
      fetchItems()
      onScheduleChange?.()
      alert(`${valid.length}개 일정이 저장되었습니다.`)
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      await apiClient.delete(`/travel-schedule/${id}`)
      if (editingId === id) handleCancelEdit()
      fetchItems()
      onScheduleChange?.()
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCancelNew = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index))
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded shadow p-6 border border-gray-200 text-center">
        <p className="text-xs text-gray-600">로그인 후 일정을 관리할 수 있습니다.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-6 border border-gray-200">
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        총 <span className="font-medium text-slate-700">{filteredItems.length}</span>개
        {searchTrim && ' (검색)'}
      </p>

      {/* 모바일: 등록 버튼 위, 그 아래 목록 */}
      <div className="md:hidden space-y-3">
        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <button type="button" onClick={handleAddNewItem} className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white">+ 일정 등록</button>
          {newItems.length > 0 && (
            <>
              <button type="button" onClick={handleBatchSave} className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white">일괄 저장 ({newItems.length})</button>
              <button type="button" onClick={() => setNewItems([])} className="px-2.5 py-1.5 text-xs font-medium rounded bg-gray-200 text-gray-700">취소</button>
            </>
          )}
        </div>
        {paginatedItems.map((item, index) => {
          const dueStr = item.dueDate ? item.dueDate.slice(0, 10) : ''
          const isHighlighted = !!highlightDate && dueStr === highlightDate
          if (editingId === item.id) {
            return (
              <div key={item.id} className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-3">
                <label className="block text-xs font-medium text-gray-600">예정일·시간</label>
                <input
                  type="datetime-local"
                  value={editFormData.dueDate ? editFormData.dueDate.slice(0, 16) : ''}
                  onChange={(e) => setEditFormData((p) => ({ ...p, dueDate: e.target.value ? toDatetimeLocal(new Date(e.target.value).toISOString()) : '' }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <label className="block text-xs font-medium text-gray-600">제목</label>
                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))} placeholder="제목" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                <label className="block text-xs font-medium text-gray-600">내용</label>
                <input type="text" value={editFormData.note} onChange={(e) => setEditFormData((p) => ({ ...p, note: e.target.value }))} placeholder="내용" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editFormData.remindEnabled} onChange={(e) => setEditFormData((p) => ({ ...p, remindEnabled: e.target.checked }))} className="rounded border-gray-300 text-blue-600" />
                  <span className="text-xs text-gray-600">알림</span>
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={handleSaveEdit} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">저장</button>
                  <button type="button" onClick={handleCancelEdit} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">취소</button>
                </div>
              </div>
            )
          }
          return (
            <div
              key={item.id}
              className={cn(
                'bg-white rounded-xl shadow border border-slate-200 p-3',
                isHighlighted && 'ring-2 ring-amber-400 ring-inset bg-amber-50/80'
              )}
            >
              {/* 1~2줄: 1줄에 날짜·제목·알림, 2줄에 내용 + 버튼 */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="text-xs text-slate-500 shrink-0">{item.dueDate ? formatDateTime(item.dueDate) : '-'}</span>
                <span className="text-sm font-medium text-gray-900 truncate min-w-0">{item.title}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{item.remindEnabled !== false ? '알림' : '-'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-xs text-gray-500 truncate min-w-0 flex-1">{item.note || '—'}</p>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => handleEdit(item)} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded">수정</button>
                  <button type="button" onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">삭제</button>
                </div>
              </div>
            </div>
          )
        })}
        {newItems.map((row, idx) => (
          <div key={`new-${idx}`} className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
            <label className="block text-xs font-medium text-gray-600">예정일·시간</label>
            <input type="datetime-local" value={row.dueDate ? row.dueDate.slice(0, 16) : ''} onChange={(e) => handleUpdateNewItem(idx, { dueDate: e.target.value ? toDatetimeLocal(new Date(e.target.value).toISOString()) : '' })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            <label className="block text-xs font-medium text-gray-600">제목</label>
            <input type="text" value={row.title} onChange={(e) => handleUpdateNewItem(idx, { title: e.target.value })} placeholder="제목" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            <label className="block text-xs font-medium text-gray-600">내용</label>
            <input type="text" value={row.note} onChange={(e) => handleUpdateNewItem(idx, { note: e.target.value })} placeholder="내용" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={row.remindEnabled} onChange={(e) => handleUpdateNewItem(idx, { remindEnabled: e.target.checked })} className="rounded border-gray-300 text-blue-600" />
              <span className="text-xs text-gray-600">알림</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => handleSaveSingleNew(idx)} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg">저장</button>
              <button type="button" onClick={() => handleCancelNew(idx)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">취소</button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && newItems.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            {searchTrim ? '검색 결과가 없습니다.' : "등록된 일정이 없습니다. 위 '일정 등록'으로 추가하세요."}
          </div>
        )}
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden md:block bg-white rounded shadow overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100 border-b-2 border-slate-300 text-slate-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold min-w-[150px]">예정일</th>
                <th className="px-2 py-2 text-left text-xs font-semibold">제목</th>
                <th className="px-2 py-2 text-left text-xs font-semibold min-w-[120px]">내용</th>
                <th className="px-2 py-2 text-center text-xs font-semibold w-20">알림여부</th>
                <th className="w-24 px-2 py-2 text-right text-xs font-semibold">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* 맨 위: 일정 추가 / 일괄 저장 / 모두 취소 */}
              <tr className="bg-blue-50 border-b-2 border-blue-200">
                <td colSpan={4} className="px-2 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded',
                        'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                      )}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      일정 추가
                    </button>
                    {newItems.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleBatchSave}
                          className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded border border-green-600"
                        >
                          일괄 저장 ({newItems.length}개)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItems([])}
                          className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded"
                        >
                          모두 취소
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2" />
              </tr>

              {/* 새로 추가 중인 행들 (버튼 바로 아래) - 인라인 JSX로 포커스 유지 */}
              {newItems.map((row, idx) => (
                <tr key={`new-${idx}`} className="bg-amber-100/90 border-l-2 border-l-amber-500 border-b border-amber-200">
                  <td className="px-2 py-1.5">
                    <DateTimePicker value={row.dueDate} onChange={(v) => handleUpdateNewItem(idx, { dueDate: v })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => handleUpdateNewItem(idx, { title: e.target.value })}
                      placeholder="제목"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => handleUpdateNewItem(idx, { note: e.target.value })}
                      placeholder="내용"
                      className={inputClass}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.remindEnabled}
                        onChange={(e) => handleUpdateNewItem(idx, { remindEnabled: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">알림</span>
                    </label>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <button type="button" onClick={() => handleSaveSingleNew(idx)} className={cn(btnClass, 'text-white bg-green-600 hover:bg-green-700 border-green-600 mr-1')}>저장</button>
                    <button type="button" onClick={() => handleCancelNew(idx)} className={cn(btnClass, 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50')}>취소</button>
                  </td>
                </tr>
              ))}

              {/* 기존 일정 행 (페이지네이션 적용) */}
              {paginatedItems.map((item, index) =>
                editingId === item.id ? (
                  <tr key={item.id} className="bg-blue-100/90 border-l-2 border-l-blue-500 border-b border-blue-200">
                    <td className="px-2 py-1.5">
                      <DateTimePicker
                        value={editFormData.dueDate}
                        onChange={(v) => setEditFormData((p) => ({ ...p, dueDate: v }))}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData((p) => ({ ...p, title: e.target.value }))}
                        placeholder="제목"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={editFormData.note}
                        onChange={(e) => setEditFormData((p) => ({ ...p, note: e.target.value }))}
                        placeholder="내용"
                        className={inputClass}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.remindEnabled}
                          onChange={(e) => setEditFormData((p) => ({ ...p, remindEnabled: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">알림</span>
                      </label>
                    </td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      <button type="button" onClick={handleSaveEdit} className={cn(btnClass, 'text-white bg-blue-600 hover:bg-blue-700 border-blue-600 mr-1')}>저장</button>
                      <button type="button" onClick={handleCancelEdit} className={cn(btnClass, 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50')}>취소</button>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const dueStr = item.dueDate ? item.dueDate.slice(0, 10) : ''
                    const isHighlighted = !!highlightDate && dueStr === highlightDate
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          (index + (currentPage - 1) * pageSize) % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                          'hover:bg-blue-50/70',
                          isHighlighted && 'ring-2 ring-amber-400 ring-inset bg-amber-50/80'
                        )}
                      >
                        <td className="px-2 py-1.5 text-xs text-gray-600 whitespace-nowrap">{item.dueDate ? formatDateTime(item.dueDate) : '-'}</td>
                        <td className="px-2 py-1.5 text-xs font-medium text-gray-900">{item.title}</td>
                        <td className="px-2 py-1.5 text-xs text-gray-500 max-w-[200px] truncate" title={item.note || ''}>{item.note || '-'}</td>
                        <td className="px-2 py-1.5 text-center text-xs text-gray-600">{item.remindEnabled !== false ? 'O' : '-'}</td>
                        <td className="px-2 py-1.5 text-right whitespace-nowrap">
                          <button type="button" onClick={() => handleEdit(item)} className="px-1.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded mr-0.5">수정</button>
                          <button type="button" onClick={() => handleDelete(item.id)} className="px-1.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded">삭제</button>
                        </td>
                      </tr>
                    )
                  })()
                )
              )}

              {filteredItems.length === 0 && newItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-xs text-gray-500">
                    {searchTrim
                      ? '검색 결과가 없습니다. 다른 검색어를 입력해 보세요.'
                      : "등록된 일정이 없습니다. 위 '일정 추가'로 새 행을 추가하세요."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          className="mt-3"
        />
      )}
    </div>
  )
}
