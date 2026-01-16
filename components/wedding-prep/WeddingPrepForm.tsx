'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

interface WeddingPrep {
  id: string
  category: string
  subCategory: string | null
  content: string
  amount: number
  status: string
  priority: number
  dueDate: Date | null
  completedAt: Date | null
  note: string | null
}

interface WeddingPrepFormProps {
  item: WeddingPrep | null
  onClose: () => void
  onSave: () => void
}

export default function WeddingPrepForm({ item, onClose, onSave }: WeddingPrepFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    subCategory: '',
    content: '',
    amount: '',
    status: '진행중',
    priority: '0',
    dueDate: '',
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        category: item.category,
        subCategory: item.subCategory || '',
        content: item.content,
        amount: item.amount.toString(),
        status: item.status,
        priority: item.priority.toString(),
        dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
        note: item.note || '',
      })
    }
  }, [item])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) {
      newErrors.category = '구분을 선택해주세요.'
    }

    if (!formData.content) {
      newErrors.content = '내용을 입력해주세요.'
    }

    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = '올바른 금액을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const data = {
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        content: formData.content,
        amount: parseInt(formData.amount) || 0,
        status: formData.status,
        priority: parseInt(formData.priority),
        dueDate: formData.dueDate || undefined,
        note: formData.note || undefined,
      }

      if (item) {
        await apiClient.put(`/wedding-prep/${item.id}`, data)
      } else {
        await apiClient.post('/wedding-prep', data)
      }

      onSave()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {item ? '항목 수정' : '항목 추가'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 구분 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구분 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="예: 예식, 혼수, 신혼여행"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* 상세구분 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세구분
                </label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  placeholder="예: 드레스, 메이크업"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="항목 내용을 입력하세요"
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.content ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  금액
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                  <option value="취소">취소</option>
                </select>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">낮음</option>
                  <option value="1">보통</option>
                  <option value="2">높음</option>
                </select>
              </div>
            </div>

            {/* 예정일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예정일
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 비고 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비고
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                placeholder="추가 메모를 입력하세요"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md',
                  'bg-gray-200 text-gray-700 hover:bg-gray-300',
                  'transition-colors'
                )}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md text-white',
                  'transition-colors',
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
