'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import WeddingPrepFilters from './WeddingPrepFilters'
import {
  CollapsibleSection,
  DataTable,
  Pagination,
  LoadingScreen,
  ButtonSave,
  ButtonCancel,
  ButtonEdit,
  ButtonDelete,
  ButtonAddItem,
  ButtonExportExcel,
  ButtonBatchSave,
  ButtonSecondary,
  ButtonEditBudget,
  ButtonPrimary,
  ButtonGrayCancel,
} from '@/components/ui'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 20

const WEDDING_PREP_COLUMNS = [
  { key: 'no', label: '번호', width: 48, minWidth: 40, align: 'center' as const },
  { key: 'category', label: '구분', width: 96, minWidth: 60, align: 'left' as const },
  { key: 'subCategory', label: '상세구분', width: 112, minWidth: 80, align: 'left' as const },
  { key: 'content', label: '내용', width: 180, minWidth: 120, align: 'left' as const },
  { key: 'amount', label: '금액', width: 120, minWidth: 80, align: 'right' as const },
  { key: 'status', label: '상태', width: 80, minWidth: 60, align: 'center' as const },
  { key: 'priority', label: '우선순위', width: 88, minWidth: 60, align: 'center' as const },
  { key: 'dueDate', label: '예정일', width: 100, minWidth: 80, align: 'center' as const },
  { key: 'note', label: '비고', width: 100, minWidth: 80, align: 'left' as const },
  { key: 'updatedBy', label: '수정자', width: 100, minWidth: 60, align: 'left' as const },
  { key: 'updatedAt', label: '수정일시', width: 120, minWidth: 90, align: 'center' as const },
  { key: 'action', label: '작업', width: 112, minWidth: 80, align: 'right' as const },
]

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
  updatedBy?: { email: string; name: string | null } | null
  updatedAt?: string | Date | null
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
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage]
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [currentPage, totalPages])

  // 현재 예산 조회 (silent: true면 로딩 표시 없이 백그라운드 갱신)
  const fetchBudget = async (silent = false) => {
    try {
      if (!silent) setBudgetLoading(true)
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

  // 항목 목록 조회 (silent: true면 로딩 표시 없이 백그라운드 갱신 - 깜빡임 방지)
  const fetchItems = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
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

  // 검색조건(필터) 변경 시 로딩 화면 없이 백그라운드 갱신, 최초 진입 시에만 로딩 표시
  const hasInitialLoadedRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) return
    if (!hasInitialLoadedRef.current) {
      hasInitialLoadedRef.current = true
      Promise.all([fetchItems(), fetchBudget()]).catch((error) => {
        console.error('Failed to fetch data:', error)
      })
    } else {
      Promise.all([fetchItems(true), fetchBudget(true)]).catch((error) => {
        console.error('Failed to fetch data:', error)
      })
    }
  }, [isAuthenticated, filters])

  // 항목 삭제 (로컬 state만 갱신해 재렌더/깜빡임 방지)
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await apiClient.delete(`/wedding-prep/${id}`)
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id)
        setTotalAmount(next.reduce((s, i) => s + i.amount, 0))
        return next
      })
      setEditingId(null)
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    }
  }

  // 항목 저장 (인라인 편집 - 단일). 수정은 로컬 state만 갱신해 깜빡임 방지
  const handleSave = async (item: Partial<WeddingPrep> & { id?: string }, newItemIndex?: number) => {
    try {
      if (item.id) {
        // 수정: API만 호출하고 로컬 state만 갱신 (재조회 없음)
        await apiClient.put(`/wedding-prep/${item.id}`, item)
        setEditingId(null)
        const existing = items.find((i) => i.id === item.id)
        if (!existing) return
        const updated: WeddingPrep = {
          ...existing,
          ...item,
          amount: item.amount ?? existing.amount,
          category: item.category ?? existing.category,
          subCategory: item.subCategory ?? existing.subCategory,
          content: item.content ?? existing.content,
          status: item.status ?? existing.status,
          priority: item.priority ?? existing.priority,
          dueDate: item.dueDate !== undefined ? item.dueDate : existing.dueDate,
          note: item.note !== undefined ? item.note : existing.note,
        }
        setItems((prev) => {
          const next = prev.map((i) => (i.id === item.id ? updated : i))
          setTotalAmount(next.reduce((s, i) => s + i.amount, 0))
          return next
        })
      } else {
        // 추가 (단일): 서버에 저장 후 목록만 백그라운드 갱신
        await apiClient.post('/wedding-prep', item)
        if (typeof newItemIndex === 'number') {
          setNewItems((prev) => prev.filter((_, idx) => idx !== newItemIndex))
        }
        fetchItems(true)
      }
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
      fetchItems(true)
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

  // 인라인 편집 행 컴포넌트 (isNewRow: 새 항목 추가 행 스타일)
  const InlineEditRow = ({
    item,
    onSave,
    onCancel,
    onChange,
    showSaveButton = true,
    isNewRow = false,
  }: {
    item?: Partial<WeddingPrep> | WeddingPrep
    onSave?: (data: Partial<WeddingPrep>) => void
    onCancel?: () => void
    onChange?: (data: Partial<WeddingPrep>) => void
    showSaveButton?: boolean
    isNewRow?: boolean
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

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault()
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
      <tr className={cn(
        isNewRow ? 'bg-amber-100/90 border-l-2 border-l-amber-500 border-b border-amber-200' : 'bg-blue-50/80 border-b-2 border-blue-200 border-l-2 border-l-blue-400'
      )}>
        <td className="px-2 py-1.5 text-center text-xs text-slate-500 w-12">-</td>
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
        <td className="px-2 py-1.5 text-center text-xs text-slate-400">-</td>
        <td className="px-2 py-1.5 text-center text-xs text-slate-400">-</td>
        <td className="px-2 py-1.5 text-center whitespace-nowrap">
          {showSaveButton && onSave && (
            <ButtonSave onClick={() => handleSubmit()} className="mr-1" />
          )}
          {onCancel && <ButtonCancel onClick={() => onCancel()} />}
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
      <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
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
                <td className="px-3 py-3 text-xs text-gray-600 truncate" title={item.updatedBy?.email}>
                  {item.updatedBy ? (item.updatedBy.name || item.updatedBy.email) : '-'}
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-gray-500">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString('ko-KR') : '-'}
                </td>
                <td className="px-3 py-3 text-center whitespace-nowrap text-xs font-medium">
                  <ButtonEdit onClick={() => handleInlineEdit(item)} className="mr-2" />
                  <ButtonDelete onClick={() => handleDelete(item.id)} />
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
          <ButtonPrimary onClick={handleSubmit} className="px-3 py-2 text-sm rounded-lg">저장</ButtonPrimary>
          <ButtonGrayCancel onClick={onCancel} className="px-3 py-2 text-sm rounded-lg">취소</ButtonGrayCancel>
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
          <ButtonPrimary onClick={handleSubmit} className="px-3 py-2 text-sm rounded-lg">저장</ButtonPrimary>
          <ButtonGrayCancel onClick={onCancel} className="px-3 py-2 text-sm rounded-lg">취소</ButtonGrayCancel>
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

  // 전체 데이터가 로드될 때까지 공통 로딩 화면
  if (loading || budgetLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-4">
      {/* 현재 예산 · 총 사용 금액 · 잔액 (상단 요약) */}
      <CollapsibleSection title="예산 요약" minimal compactDesktop>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50">
        <div className="flex flex-wrap items-center gap-6 md:gap-8">
          {/* 현재 예산 */}
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
                <ButtonPrimary onClick={handleBudgetUpdate}>저장</ButtonPrimary>
                <ButtonGrayCancel
                  onClick={() => {
                    setEditingBudget(false)
                    setTempBudget('')
                  }}
                >
                  취소
                </ButtonGrayCancel>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                  {currentBudget.toLocaleString('ko-KR')}원
                </span>
                <ButtonEditBudget
                  onClick={() => {
                    setEditingBudget(true)
                    setTempBudget(currentBudget.toString())
                  }}
                >
                  수정
                </ButtonEditBudget>
              </>
            )}
          </div>
          {/* 총 사용 금액 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">총 사용 금액</span>
            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
              {totalAmount.toLocaleString('ko-KR')}원
            </span>
          </div>
          {/* 잔액 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">잔액</span>
            <span
              className={cn(
                'text-lg font-bold whitespace-nowrap',
                budgetDifference >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {budgetDifference >= 0 ? '+' : ''}
              {budgetDifference.toLocaleString('ko-KR')}원
            </span>
          </div>
        </div>
      </div>
      </CollapsibleSection>

      {/* 검색조건 및 액션 버튼 */}
      <CollapsibleSection title="검색조건" minimal compactDesktop defaultOpen={false}>
      <div className="bg-white rounded-xl shadow-lg p-2 md:p-3 border border-gray-200/50">
        <div className="flex flex-wrap items-center gap-2">
          <WeddingPrepFilters filters={filters} setFilters={setFilters} categories={categories} />
          <ButtonExportExcel onClick={handleExportExcel} />
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
            {paginatedItems.map((item, index) => (
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
                      <ButtonEdit onClick={() => handleInlineEdit(item)} className="px-2 py-1.5 bg-blue-50 rounded-lg" />
                      <ButtonDelete onClick={() => handleDelete(item.id)} className="px-2 py-1.5 bg-red-50 rounded-lg" />
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
              <ButtonAddItem onClick={handleAddNewItem} className="px-3 py-2 rounded-lg" />
              {newItems.length > 0 && (
                <>
                  <ButtonBatchSave onClick={handleBatchSave}>일괄 저장 ({newItems.length}개)</ButtonBatchSave>
                  <ButtonSecondary onClick={() => setNewItems([])} className="px-3 py-2">모두 취소</ButtonSecondary>
                </>
              )}
            </div>
          </>
        )}
      </div>
      </CollapsibleSection>
      </div>

      {/* 데스크톱: 테이블 (컬럼 리사이즈 가능) */}
      <div className="hidden md:block bg-white rounded shadow overflow-hidden border border-slate-200">
        <DataTable
          columns={WEDDING_PREP_COLUMNS}
          storageKey="wedding-prep-table"
          minTableWidth={900}
          footer={
            <tr>
              <td colSpan={9} className="px-2 py-3" />
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-600 mb-0.5">총 사용 금액</span>
                  <span className="text-base font-bold text-slate-900 whitespace-nowrap">
                    {totalAmount.toLocaleString('ko-KR')}원
                  </span>
                </div>
              </td>
              <td className="px-2 py-3" />
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-600 mb-0.5">잔액</span>
                  <span
                    className={cn(
                      'text-base font-bold whitespace-nowrap',
                      budgetDifference >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {budgetDifference >= 0 ? '+' : ''}
                    {budgetDifference.toLocaleString('ko-KR')}원
                  </span>
                </div>
              </td>
            </tr>
          }
        >
          {/* 맨 위: 항목 추가 / 일괄 저장 / 모두 취소 */}
          <tr className="bg-blue-50 border-b-2 border-blue-200">
            <td className="px-2 py-2 text-center text-xs text-slate-500">-</td>
            <td colSpan={10} className="px-2 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <ButtonAddItem onClick={handleAddNewItem} />
                {newItems.length > 0 && (
                  <>
                    <ButtonBatchSave onClick={handleBatchSave}>일괄 저장 ({newItems.length}개)</ButtonBatchSave>
                    <ButtonSecondary onClick={() => setNewItems([])}>모두 취소</ButtonSecondary>
                  </>
                )}
              </div>
            </td>
            <td className="px-2 py-2" />
          </tr>

          {newItems.map((newItem, idx) => (
            <InlineEditRow
              key={`new-${idx}`}
              item={newItem}
              onCancel={() => handleCancelEdit(idx)}
              onSave={(data) => {
                handleUpdateNewItem(idx, data)
                handleSave(data, idx)
              }}
              showSaveButton={true}
              isNewRow
            />
          ))}

          {items.length === 0 && newItems.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-2 py-8 text-center text-xs text-slate-500">
                등록된 항목이 없습니다. 위 &apos;항목 추가&apos;로 새 행을 추가하세요.
              </td>
            </tr>
          ) : (
            paginatedItems.map((item, index) => (
              <TableRow key={item.id} item={item} index={(currentPage - 1) * PAGE_SIZE + index} />
            ))
          )}
        </DataTable>
      </div>

      {items.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={items.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          className="mt-3"
        />
      )}
    </div>
  )
}
