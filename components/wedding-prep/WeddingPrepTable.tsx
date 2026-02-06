'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import WeddingPrepFilters from './WeddingPrepFilters'
import { CollapsibleSection } from '@/components/ui'
import * as XLSX from 'xlsx'

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

export default function WeddingPrepTable() {
  const { isAuthenticated } = useWeddingStore()
  const [items, setItems] = useState<WeddingPrep[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItems, setNewItems] = useState<Partial<WeddingPrep>[]>([]) // 여러 개의 새 항목
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    minAmount: '',
    maxAmount: '',
  })
  const [totalAmount, setTotalAmount] = useState(0)
  const [currentBudget, setCurrentBudget] = useState(0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState('')
  const [budgetLoading, setBudgetLoading] = useState(true)

  // 현재 예산 조회
  const fetchBudget = async () => {
    try {
      setBudgetLoading(true)
      const response = await apiClient.get('/user/budget')
      setCurrentBudget(response.data.budget || 0)
    } catch (error) {
      console.error('Failed to fetch budget:', error)
    } finally {
      setBudgetLoading(false)
    }
  }

  // 현재 예산 업데이트
  const handleBudgetUpdate = async () => {
    try {
      const budget = parseInt(tempBudget) || 0
      await apiClient.put('/user/budget', { budget })
      setCurrentBudget(budget)
      setEditingBudget(false)
      setTempBudget('')
    } catch (error: any) {
      alert(error.response?.data?.error || '예산 업데이트 중 오류가 발생했습니다.')
    }
  }

  // 항목 목록 조회
  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.minAmount) params.append('minAmount', filters.minAmount)
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount)

      const response = await apiClient.get(`/wedding-prep?${params.toString()}`)
      const items = response.data.items || []
      
      // 정렬: 상태별 우선순위 (진행중 > 완료 > 취소), 같은 상태 내에서는 우선순위 높은 순
      const statusOrder: Record<string, number> = {
        '진행중': 2,
        '완료': 1,
        '취소': 0,
      }
      
      const sortedItems = [...items].sort((a, b) => {
        // 상태별 우선순위로 정렬
        const statusDiff = (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0)
        if (statusDiff !== 0) {
          return statusDiff
        }
        // 같은 상태 내에서는 우선순위가 높은 순서대로 (priority가 높을수록 먼저)
        return (b.priority || 0) - (a.priority || 0)
      })
      
      setItems(sortedItems)
      setTotalAmount(response.data.totalAmount)
    } catch (error: any) {
      console.error('Failed to fetch items:', error)
      alert(error.response?.data?.error || '항목을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      // 두 데이터를 병렬로 로드
      Promise.all([fetchItems(), fetchBudget()]).catch((error) => {
        console.error('Failed to fetch data:', error)
      })
    }
  }, [isAuthenticated, filters])

  // 항목 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await apiClient.delete(`/wedding-prep/${id}`)
      fetchItems()
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    }
  }

  // 항목 저장 (인라인 편집 - 단일)
  const handleSave = async (item: Partial<WeddingPrep> & { id?: string }, newItemIndex?: number) => {
    try {
      if (item.id) {
        // 수정
        await apiClient.put(`/wedding-prep/${item.id}`, item)
        setEditingId(null)
      } else {
        // 추가 (단일)
        await apiClient.post('/wedding-prep', item)
        // 임시 항목 배열에서 제거
        if (typeof newItemIndex === 'number') {
          setNewItems(prev => prev.filter((_, idx) => idx !== newItemIndex))
        }
      }
      fetchItems()
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  // 일괄 저장 (여러 항목)
  const handleBatchSave = async () => {
    if (newItems.length === 0) return

    // 필수 필드 검증
    const validItems = newItems.filter(item => item.category && item.content)
    const invalidCount = newItems.length - validItems.length

    if (invalidCount > 0) {
      alert(`${invalidCount}개의 항목에서 구분 또는 내용이 누락되었습니다.`)
      return
    }

    try {
      // 모든 항목을 병렬로 저장
      await Promise.all(
        validItems.map(item => apiClient.post('/wedding-prep', item))
      )
      
      setNewItems([])
      fetchItems()
      alert(`${validItems.length}개의 항목이 저장되었습니다.`)
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  // 인라인 편집 시작
  const handleInlineEdit = (item: WeddingPrep) => {
    setEditingId(item.id)
  }

  // 인라인 편집 취소
  const handleCancelEdit = (newItemIndex?: number) => {
    setEditingId(null)
    if (typeof newItemIndex === 'number') {
      // 특정 임시 항목 삭제
      setNewItems(prev => prev.filter((_, idx) => idx !== newItemIndex))
    }
  }

  // 새 항목 추가
  const handleAddNewItem = () => {
    setNewItems(prev => [
      ...prev,
      {
        category: '',
        subCategory: null,
        content: '',
        amount: 0,
        status: '진행중',
        priority: 0,
        dueDate: null,
        note: null,
      }
    ])
  }

  // 임시 항목 업데이트
  const handleUpdateNewItem = (index: number, data: Partial<WeddingPrep>) => {
    setNewItems(prev => prev.map((item, idx) => idx === index ? { ...item, ...data } : item))
  }

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)

      const response = await apiClient.get(`/wedding-prep/export?${params.toString()}`)
      const data = response.data.data

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      const colWidths = [
        { wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, '결혼준비')
      const fileName = `결혼준비_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error: any) {
      alert(error.response?.data?.error || '엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 카테고리 목록 (필터용) - 전체 카테고리 목록 사용
  const allCategories = ['스드메', '예식장', '가전/가구', '신혼여행']
  
  // 카테고리 목록 (필터에서 사용)
  const categories = allCategories

  // 예산 차이 계산
  const budgetDifference = currentBudget - totalAmount

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
      case '진행중':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
      case '취소':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
    }
  }

  // 우선순위별 색상
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 2:
        return 'text-red-700 font-bold'
      case 1:
        return 'text-orange-600 font-semibold'
      default:
        return 'text-gray-600'
    }
  }

  // 인라인 편집 행 컴포넌트
  const InlineEditRow = ({
    item,
    onSave,
    onCancel,
    onChange,
    showSaveButton = true,
  }: {
    item?: Partial<WeddingPrep> | WeddingPrep
    onSave?: (data: Partial<WeddingPrep>) => void
    onCancel?: () => void
    onChange?: (data: Partial<WeddingPrep>) => void
    showSaveButton?: boolean
  }) => {
    // useRef로 초기값을 고정 (컴포넌트가 재생성되어도 유지)
    const initialFormDataRef = useRef({
      category: item?.category || '',
      subCategory: item?.subCategory || '',
      content: item?.content || '',
      amount: item?.amount?.toString() || '0',
      status: item?.status || '진행중',
      priority: item?.priority?.toString() || '0',
      dueDate: item?.dueDate ? new Date(item.dueDate as Date).toISOString().split('T')[0] : '',
      note: item?.note || '',
    })

    const [formData, setFormData] = useState(initialFormDataRef.current)

    // 구분 옵션
    const categories = ['스드메', '예식장', '가전/가구', '신혼여행', '기타']

    // 상세구분 옵션 (구분에 따라 동적 변경)
    const getSubCategories = (category: string): string[] => {
      switch (category) {
        case '스드메':
          return ['스튜디오', '드레스', '메이크업', '기타']
        case '예식장':
          return ['예식장', '기타']
        case '가전/가구':
          return ['가전', '가구', '기타']
        case '신혼여행':
          return ['항공권', '호텔', '기타']
        case '기타':
          return ['기타']
        default:
          return []
      }
    }

    // onChange 모드 (실시간 업데이트) - 한글 입력 시 커서 유지를 위해 로컬 상태만 업데이트
    const handleChange = useCallback((field: string, value: string) => {
      setFormData(prev => {
        const updated = { ...prev, [field]: value }
        
        // 구분이 변경되면 상세구분 초기화
        if (field === 'category') {
          const subCategories = getSubCategories(value)
          updated.subCategory = subCategories.length > 0 ? subCategories[0] : ''
        }
        
        return updated
      })
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.category || !formData.content) {
        alert('구분과 내용은 필수입니다.')
        return
      }
      
      const saveData = {
        ...(item && 'id' in item && item.id ? { id: item.id } : {}),
        category: formData.category,
        subCategory: formData.subCategory || null,
        content: formData.content,
        amount: parseInt(formData.amount) || 0,
        status: formData.status,
        priority: parseInt(formData.priority) || 0,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        note: formData.note || null,
      }
      
      // 저장 시에만 onChange 호출 (부모 상태 업데이트)
      if (onChange) {
        onChange(saveData)
      }
      
      if (onSave) {
        onSave(saveData)
      }
    }

    return (
      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
        <td className="px-3 py-2 text-center text-xs text-gray-500">-</td>
        <td className="px-3 py-2">
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">선택</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select
            value={formData.subCategory}
            onChange={(e) => handleChange('subCategory', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={!formData.category}
          >
            <option value="">선택</option>
            {formData.category && getSubCategories(formData.category).map((subCat) => (
              <option key={subCat} value={subCat}>
                {subCat}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="내용"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="진행중">진행중</option>
            <option value="완료">완료</option>
            <option value="취소">취소</option>
          </select>
        </td>
        <td className="px-3 py-2">
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">낮음</option>
            <option value="1">보통</option>
            <option value="2">높음</option>
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="비고"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-3 py-2 text-center">
          {showSaveButton && onSave && (
            <button
              onClick={handleSubmit}
                className="px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 mr-2 text-xs font-medium shadow-sm hover:shadow"
            >
              저장
            </button>
          )}
          {onCancel && (
            <button 
              onClick={onCancel} 
              className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
            >
              취소
            </button>
          )}
        </td>
      </tr>
    )
  }

  // 테이블 행 컴포넌트
  const TableRow = ({ item, index }: { item: WeddingPrep; index: number }) => {
    if (editingId === item.id) {
      return (
        <InlineEditRow
          item={item}
          onSave={(data) => handleSave({ ...data, id: item.id })}
          onCancel={handleCancelEdit}
        />
      )
    }

    return (
      <tr className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200 border-b border-gray-100">
        <td className="px-3 py-3 text-center text-xs text-gray-900">{index + 1}</td>
        <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
          {item.category}
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">
          {item.subCategory || '-'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-900 truncate" title={item.content}>
          {item.content}
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
          <span className="whitespace-nowrap">{item.amount.toLocaleString('ko-KR')}원</span>
        </td>
        <td className="px-3 py-3 text-center">
          <span
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-lg shadow-sm',
              getStatusColor(item.status)
            )}
          >
            {item.status}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          <span className={cn('text-xs px-2 py-1 rounded-lg', getPriorityColor(item.priority), 
            item.priority === 2 ? 'bg-red-50' : item.priority === 1 ? 'bg-orange-50' : 'bg-gray-50'
          )}>
            {item.priority === 2 ? '높음' : item.priority === 1 ? '보통' : '낮음'}
          </span>
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-gray-600">
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ko-KR') : '-'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 truncate" title={item.note || ''}>
          {item.note || '-'}
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap text-xs font-medium">
          <button
            onClick={() => handleInlineEdit(item)}
            className="px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors mr-2"
          >
            수정
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            삭제
          </button>
        </td>
      </tr>
    )
  }

  // 모바일 편집 카드 (기존 항목)
  const MobileEditCard = ({
    item,
    onSave,
    onCancel,
    getStatusColor,
    getPriorityColor,
  }: {
    item: WeddingPrep
    onSave: (data: Partial<WeddingPrep>) => void
    onCancel: () => void
    getStatusColor: (s: string) => string
    getPriorityColor: (p: number) => string
  }) => {
    const catOpts = ['스드메', '예식장', '가전/가구', '신혼여행', '기타']
    const getSub = (c: string): string[] => {
      switch (c) {
        case '스드메': return ['스튜디오', '드레스', '메이크업', '기타']
        case '예식장': return ['예식장', '기타']
        case '가전/가구': return ['가전', '가구', '기타']
        case '신혼여행': return ['항공권', '호텔', '기타']
        case '기타': return ['기타']
        default: return []
      }
    }
    const [form, setForm] = useState({
      category: item.category,
      subCategory: item.subCategory || '',
      content: item.content,
      amount: String(item.amount),
      status: item.status,
      priority: String(item.priority ?? 0),
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
      note: item.note || '',
    })
    const handleSubmit = () => {
      if (!form.category || !form.content) { alert('구분과 내용은 필수입니다.'); return }
      onSave({
        id: item.id,
        category: form.category,
        subCategory: form.subCategory || null,
        content: form.content,
        amount: parseInt(form.amount) || 0,
        status: form.status,
        priority: parseInt(form.priority) || 0,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        note: form.note || null,
      })
    }
    return (
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">구분</label>
        <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value, subCategory: '' }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
          {catOpts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="block text-xs font-medium text-gray-600">상세구분</label>
        <select value={form.subCategory} onChange={(e) => setForm(f => ({ ...f, subCategory: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" disabled={!form.category}>
          {getSub(form.category).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="block text-xs font-medium text-gray-600">내용</label>
        <input type="text" value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="내용" />
        <label className="block text-xs font-medium text-gray-600">금액</label>
        <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" min={0} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">상태</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">우선순위</label>
            <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
              <option value="0">낮음</option>
              <option value="1">보통</option>
              <option value="2">높음</option>
            </select>
          </div>
        </div>
        <label className="block text-xs font-medium text-gray-600">예정일</label>
        <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <label className="block text-xs font-medium text-gray-600">비고</label>
        <input type="text" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="비고" />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleSubmit} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg">저장</button>
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">취소</button>
        </div>
      </div>
    )
  }

  // 모바일 새 항목 카드
  const MobileNewItemCard = ({ item, onSave, onCancel }: { item: Partial<WeddingPrep>; onSave: (data: Partial<WeddingPrep>) => void; onCancel: () => void }) => {
    const catOpts = ['스드메', '예식장', '가전/가구', '신혼여행', '기타']
    const getSub = (c: string): string[] => {
      switch (c) {
        case '스드메': return ['스튜디오', '드레스', '메이크업', '기타']
        case '예식장': return ['예식장', '기타']
        case '가전/가구': return ['가전', '가구', '기타']
        case '신혼여행': return ['항공권', '호텔', '기타']
        case '기타': return ['기타']
        default: return []
      }
    }
    const [form, setForm] = useState({
      category: item?.category || '',
      subCategory: item?.subCategory || '',
      content: item?.content || '',
      amount: String(item?.amount ?? 0),
      status: item?.status || '진행중',
      priority: String(item?.priority ?? 0),
      dueDate: item?.dueDate ? new Date(item.dueDate as Date).toISOString().slice(0, 10) : '',
      note: item?.note || '',
    })
    const handleSubmit = () => {
      if (!form.category || !form.content) { alert('구분과 내용은 필수입니다.'); return }
      onSave({
        category: form.category,
        subCategory: form.subCategory || null,
        content: form.content,
        amount: parseInt(form.amount) || 0,
        status: form.status,
        priority: parseInt(form.priority) || 0,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        note: form.note || null,
      })
    }
    return (
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">구분</label>
        <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value, subCategory: '' }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
          {catOpts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="block text-xs font-medium text-gray-600">상세구분</label>
        <select value={form.subCategory} onChange={(e) => setForm(f => ({ ...f, subCategory: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" disabled={!form.category}>
          {getSub(form.category).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="block text-xs font-medium text-gray-600">내용</label>
        <input type="text" value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="내용" />
        <label className="block text-xs font-medium text-gray-600">금액</label>
        <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" min={0} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">상태</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">우선순위</label>
            <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
              <option value="0">낮음</option>
              <option value="1">보통</option>
              <option value="2">높음</option>
            </select>
          </div>
        </div>
        <label className="block text-xs font-medium text-gray-600">예정일</label>
        <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <label className="block text-xs font-medium text-gray-600">비고</label>
        <input type="text" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="비고" />
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleSubmit} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg">저장</button>
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">취소</button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </div>
    )
  }

  // 전체 데이터가 로드될 때까지 로딩 화면 표시
  if (loading || budgetLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 현재 예산 표시 (상단) */}
      <CollapsibleSection title="현재 예산" minimal compactDesktop>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600">현재 예산</span>
            {editingBudget ? (
              <>
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  placeholder={currentBudget.toString()}
                  className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  autoFocus
                />
                <button
                  onClick={handleBudgetUpdate}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingBudget(false)
                    setTempBudget('')
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-sm"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                  {currentBudget.toLocaleString('ko-KR')}원
                </span>
                <button
                  onClick={() => {
                    setEditingBudget(true)
                    setTempBudget(currentBudget.toString())
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                >
                  수정
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      </CollapsibleSection>

      {/* 검색조건 및 액션 버튼 */}
      <CollapsibleSection title="검색조건" minimal compactDesktop defaultOpen={false}>
      <div className="bg-white rounded-xl shadow-lg p-2 md:p-3 border border-gray-200/50">
        <div className="flex flex-wrap items-center gap-2">
          <WeddingPrepFilters filters={filters} setFilters={setFilters} categories={categories} />
          <button
            onClick={handleExportExcel}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg',
              'bg-green-600 text-white hover:bg-green-700',
              'transition-colors shadow-sm touch-manipulation'
            )}
          >
            엑셀
          </button>
        </div>
      </div>
      </CollapsibleSection>

      {/* 모바일: 카드 목록 */}
      <div className="md:hidden">
      <CollapsibleSection title="목록" minimal defaultOpen={false}>
      <div className="space-y-3">
        {items.length === 0 && newItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200/50 text-center text-sm text-gray-500">
            등록된 항목이 없습니다.
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              editingId === item.id ? (
                <MobileEditCard
                  key={item.id}
                  item={item}
                  onSave={(data) => handleSave({ ...data, id: item.id })}
                  onCancel={handleCancelEdit}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                />
              ) : (
                <div key={item.id} className="bg-white rounded-xl shadow border border-gray-200/50 p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{item.content}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
                        <span className="font-semibold text-gray-900">{item.amount.toLocaleString('ko-KR')}원</span>
                        <span className={cn('px-1.5 py-0.5 rounded', getStatusColor(item.status))}>{item.status}</span>
                        <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('ko-KR') : '-'}</span>
                      </div>
                      {item.note ? <p className="text-xs text-gray-500 mt-1 truncate">{item.note}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => handleInlineEdit(item)} className="px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg">수정</button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg">삭제</button>
                    </div>
                  </div>
                </div>
              )
            ))}
            {newItems.map((newItem, idx) => (
              <MobileNewItemCard
                key={`new-${idx}`}
                item={newItem}
                onSave={(data) => {
                  handleUpdateNewItem(idx, data)
                  handleSave(data, idx)
                }}
                onCancel={() => handleCancelEdit(idx)}
              />
            ))}
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <button type="button" onClick={handleAddNewItem} className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white">+ 항목 추가</button>
              {newItems.length > 0 && (
                <>
                  <button type="button" onClick={handleBatchSave} className="px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white">일괄 저장 ({newItems.length}개)</button>
                  <button type="button" onClick={() => setNewItems([])} className="px-3 py-2 text-xs font-medium rounded-lg bg-gray-200 text-gray-700">모두 취소</button>
                </>
              )}
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-xl border border-gray-200 text-sm">
              <span className="text-gray-600">총 사용 금액</span>
              <span className="font-bold text-gray-900">{totalAmount.toLocaleString('ko-KR')}원</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-xl border border-gray-200 text-sm">
              <span className="text-gray-600">잔액</span>
              <span className={cn('font-bold', budgetDifference >= 0 ? 'text-green-600' : 'text-red-600')}>{budgetDifference >= 0 ? '+' : ''}{budgetDifference.toLocaleString('ko-KR')}원</span>
            </div>
          </>
        )}
      </div>
      </CollapsibleSection>
      </div>

      {/* 데스크톱: 테이블 */}
      <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/50">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 table-fixed min-w-[900px]">
            {/* 테이블 헤더 - 항상 표시 */}
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="w-12 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  구분
                </th>
                <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세구분
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th className="w-40 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="w-28 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="w-28 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="w-36 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  예정일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비고
                </th>
                <th className="w-28 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* 데이터 행 */}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    등록된 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id} item={item} index={index} />
                ))
              )}

              {/* 새 항목 추가 행들 */}
              {newItems.map((newItem, idx) => (
                <InlineEditRow
                  key={`new-${idx}`}
                  item={newItem}
                  onCancel={() => handleCancelEdit(idx)}
                  onSave={(data) => {
                    // 저장 시에만 부모 상태 업데이트
                    handleUpdateNewItem(idx, data)
                    handleSave(data, idx)
                  }}
                  showSaveButton={true}
                />
              ))}

              {/* 추가 버튼 및 일괄 저장 */}
              <tr className="hover:bg-gray-50 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                <td colSpan={9} className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddNewItem}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-lg',
                        'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800',
                        'transition-all duration-200 shadow-md hover:shadow-lg'
                      )}
                    >
                      + 항목 추가
                    </button>
                    {newItems.length > 0 && (
                      <>
                        <button
                          onClick={handleBatchSave}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-lg',
                            'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800',
                            'transition-all duration-200 shadow-md hover:shadow-lg'
                          )}
                        >
                          일괄 저장 ({newItems.length}개)
                        </button>
                        <button
                          onClick={() => setNewItems([])}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-md',
                            'bg-gray-200 text-gray-700 hover:bg-gray-300',
                            'transition-colors'
                          )}
                        >
                          모두 취소
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3"></td>
              </tr>
            </tbody>
            {/* 테이블 하단 - 총 사용 금액 및 예산 차이 계산 */}
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={7} className="px-4 py-4"></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-600 mb-1">총 사용 금액</span>
                    <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                      {totalAmount.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-600 mb-1">잔액</span>
                    <span
                      className={cn(
                        'text-lg font-bold whitespace-nowrap',
                        budgetDifference >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {budgetDifference >= 0 ? '+' : ''}
                      {budgetDifference.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
