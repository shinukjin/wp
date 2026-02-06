'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import RealEstateFilters from './RealEstateFilters'
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
  ButtonPrimary,
} from '@/components/ui'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 20

const URL_COL_WIDTH = 180
const IMAGE_PATH_MAX_LEN = 45

function truncateImagePath(path: string): string {
  if (!path || path.length <= IMAGE_PATH_MAX_LEN) return path || '이미지 없음'
  return path.slice(0, IMAGE_PATH_MAX_LEN) + '...'
}

const REAL_ESTATE_COLUMNS = [
  { key: 'no', label: '번호', width: 56, minWidth: 48, align: 'center' as const },
  { key: 'category', label: '구분', width: 88, minWidth: 72, align: 'left' as const },
  { key: 'region', label: '지역', width: 120, minWidth: 100, align: 'left' as const },
  { key: 'rooms', label: '방', width: 120, minWidth:100, align: 'center' as const },
  { key: 'bathrooms', label: '화장실', width: 80, minWidth: 60, align: 'center' as const },
  { key: 'price', label: '가격', width: 80, minWidth: 60, align: 'right' as const },
  { key: 'balance', label: '잔액', width: 140, minWidth: 120, align: 'right' as const },
  { key: 'monthly', label: '월납입금', width: 130, minWidth: 110, align: 'right' as const },
  { key: 'preference', label: '선호도', width: 80, minWidth: 64, align: 'center' as const },
  { key: 'images', label: '이미지', width: 200, minWidth: 180, align: 'center' as const },
  { key: 'url', label: 'URL', width: URL_COL_WIDTH, minWidth: 160, align: 'left' as const },
  { key: 'note', label: '비고', width: URL_COL_WIDTH * 2, minWidth: 320, align: 'left' as const },
  { key: 'updatedBy', label: '수정자', width: 120, minWidth: 100, align: 'left' as const },
  { key: 'updatedAt', label: '수정일시', width: 150, minWidth: 130, align: 'left' as const },
  { key: 'action', label: '작업', width: 130, minWidth: 110, align: 'center' as const },
]

interface RealEstate {
  id: string
  category: string
  region: string
  rooms: number
  bathrooms: number
  price: number
  preference: number
  images: string[]
  url: string | null
  note: string | null
  updatedBy?: { email: string; name: string | null } | null
  updatedAt?: string | Date | null
}

export default function RealEstateTable() {
  const { isAuthenticated } = useWeddingStore()
  const [items, setItems] = useState<RealEstate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItems, setNewItems] = useState<Partial<RealEstate>[]>([])
  const [filters, setFilters] = useState({
    category: '',
    region: '',
    minPrice: '',
    maxPrice: '',
  })
  const [loanInfo, setLoanInfo] = useState({
    ownMoney: 0,
    loanAmount: 0,
    loanRate: 0,
    loanPeriod: 0,
  })
  const [editingLoanInfo, setEditingLoanInfo] = useState(false)
  const [tempLoanInfo, setTempLoanInfo] = useState({
    ownMoney: '0',
    loanAmount: '0',
    loanRate: '0',
    loanPeriod: '0',
  })
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [items, currentPage]
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages))
  }, [currentPage, totalPages])

  // 항목 목록 조회 (silent: true면 로딩 표시 없이 백그라운드 갱신 - 깜빡임 방지)
  const fetchItems = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.region) params.append('region', filters.region)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)

      const response = await apiClient.get(`/real-estate?${params.toString()}`)
      setItems(response.data.items)
    } catch (error: any) {
      console.error('Failed to fetch items:', error)
      alert(error.response?.data?.error || '항목을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 대출 정보 조회 (내 보유금은 계산된 값 사용)
  const fetchLoanInfo = async () => {
    try {
      // 사용자 정보에서 계산된 ownMoney 가져오기
      const userResponse = await apiClient.get('/user')
      const calculatedOwnMoney = userResponse.data.ownMoney
      
      // 대출 정보 가져오기
      const loanResponse = await apiClient.get('/user/loan')
      setLoanInfo({
        ownMoney: calculatedOwnMoney, // 계산된 보유금 사용
        loanAmount: loanResponse.data.loanAmount,
        loanRate: loanResponse.data.loanRate,
        loanPeriod: loanResponse.data.loanPeriod,
      })
      setTempLoanInfo({
        ownMoney: calculatedOwnMoney.toString(),
        loanAmount: loanResponse.data.loanAmount.toString(),
        loanRate: loanResponse.data.loanRate.toString(),
        loanPeriod: loanResponse.data.loanPeriod.toString(),
      })
    } catch (error) {
      console.error('Failed to fetch loan info:', error)
    }
  }

  // 대출 정보 업데이트 (ownMoney는 제외 - 자동 계산되므로)
  const handleLoanInfoUpdate = async () => {
    try {
      const updateData = {
        loanAmount: parseInt(tempLoanInfo.loanAmount) || 0,
        loanRate: parseFloat(tempLoanInfo.loanRate) || 0,
        loanPeriod: parseInt(tempLoanInfo.loanPeriod) || 0,
      }
      await apiClient.put('/user/loan', updateData)
      
      // 업데이트 후 다시 정보 조회 (계산된 ownMoney 포함)
      await fetchLoanInfo()
      setEditingLoanInfo(false)
    } catch (error: any) {
      alert(error.response?.data?.error || '대출 정보 업데이트 중 오류가 발생했습니다.')
    }
  }

  // 원리금균등상환 월납입금 계산
  const calculateMonthlyPayment = (price: number): number => {
    const { ownMoney, loanAmount, loanRate, loanPeriod } = loanInfo
    const neededLoan = Math.max(0, price - ownMoney)
    const actualLoan = Math.min(neededLoan, loanAmount)
    
    if (actualLoan === 0 || loanRate === 0 || loanPeriod === 0) {
      return 0
    }

    const monthlyRate = loanRate / 100 / 12
    const numPayments = loanPeriod

    if (monthlyRate === 0) {
      return actualLoan / numPayments
    }

    const monthlyPayment = actualLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1)

    return monthlyPayment
  }

  // 검색조건(필터) 변경 시 로딩 화면 없이 백그라운드 갱신, 최초 진입 시에만 로딩 표시
  const hasInitialLoadedRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) return
    if (!hasInitialLoadedRef.current) {
      hasInitialLoadedRef.current = true
      fetchItems()
      fetchLoanInfo()
    } else {
      fetchItems(true)
    }
  }, [isAuthenticated, filters])

  // 항목 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await apiClient.delete(`/real-estate/${id}`)
      fetchItems(true)
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    }
  }

  // 항목 저장 (인라인 편집 - 단일)
  const handleSave = async (item: Partial<RealEstate> & { id?: string }, newItemIndex?: number) => {
    try {
      if (item.id) {
        // 수정
        await apiClient.put(`/real-estate/${item.id}`, item)
        setEditingId(null)
      } else {
        // 추가 (단일)
        await apiClient.post('/real-estate', item)
        // 임시 항목 배열에서 제거
        if (typeof newItemIndex === 'number') {
          setNewItems(prev => prev.filter((_, idx) => idx !== newItemIndex))
        }
      }
      fetchItems(true)
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  // 일괄 저장 (여러 항목)
  const handleBatchSave = async () => {
    if (newItems.length === 0) return

    // 필수 필드 검증
    const validItems = newItems.filter(item => item.category && item.region)
    const invalidCount = newItems.length - validItems.length

    if (invalidCount > 0) {
      alert(`${invalidCount}개의 항목에서 구분 또는 지역이 누락되었습니다.`)
      return
    }

    try {
      // 모든 항목을 병렬로 저장
      await Promise.all(
        validItems.map(item => apiClient.post('/real-estate', item))
      )
      
      setNewItems([])
      fetchItems(true)
      alert(`${validItems.length}개의 항목이 저장되었습니다.`)
    } catch (error: any) {
      alert(error.response?.data?.error || '저장 중 오류가 발생했습니다.')
    }
  }

  // 인라인 편집 시작
  const handleInlineEdit = (item: RealEstate) => {
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
        region: '',
        rooms: 0,
        bathrooms: 0,
        price: 0,
        preference: 1,
        images: [],
        url: null,
        note: null,
      }
    ])
  }

  // 임시 항목 업데이트
  const handleUpdateNewItem = (index: number, data: Partial<RealEstate>) => {
    setNewItems(prev => prev.map((item, idx) => idx === index ? { ...item, ...data } : item))
  }

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    try {
      // 대출 정보를 다시 가져오기 (최신 정보 보장)
      const loanResponse = await apiClient.get('/user/loan')
      const currentLoanInfo = loanResponse.data

      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.region) params.append('region', filters.region)

      const response = await apiClient.get(`/real-estate?${params.toString()}`)
      const items: RealEstate[] = response.data.items || []

      // 헤더와 데이터를 포함한 배열 생성
      const excelData: any[] = []
      
      // 정보 섹션 (병합 없이 각 행에 라벨과 값을 넣음)
      excelData.push(['부동산 관리 정보', '', '', '', '', '', '', '', '', '', '', ''])
      excelData.push(['내 보유금', `${(currentLoanInfo.ownMoney || 0).toLocaleString('ko-KR')}원`, '', '', '', '', '', '', '', '', '', ''])
      excelData.push(['내 대출금', `${(currentLoanInfo.loanAmount || 0).toLocaleString('ko-KR')}원`, '', '', '', '', '', '', '', '', '', ''])
      excelData.push(['대출이율', `${(currentLoanInfo.loanRate || 0).toFixed(2)}%`, '', '', '', '', '', '', '', '', '', ''])
      excelData.push(['대출기간', `${(currentLoanInfo.loanPeriod || 0)}개월`, '', '', '', '', '', '', '', '', '', ''])
      excelData.push([]) // 빈 행

      // 테이블 헤더
      excelData.push([
        '번호',
        '구분',
        '지역',
        '방',
        '화장실',
        '가격',
        '잔액',
        '월납입금',
        '선호도',
        '이미지',
        'URL',
        '비고'
      ])

      // 데이터 행
      items.forEach((item: RealEstate, index: number) => {
        const balance = (currentLoanInfo.ownMoney || 0) + (currentLoanInfo.loanAmount || 0) - (item.price || 0)
        
        // 월납입금 계산
        const neededLoan = Math.max(0, (item.price || 0) - (currentLoanInfo.ownMoney || 0))
        const actualLoan = Math.min(neededLoan, currentLoanInfo.loanAmount || 0)
        let monthlyPayment = 0
        if (actualLoan > 0 && currentLoanInfo.loanRate > 0 && currentLoanInfo.loanPeriod > 0) {
          const monthlyRate = currentLoanInfo.loanRate / 100 / 12
          const numPayments = currentLoanInfo.loanPeriod
          if (monthlyRate === 0) {
            monthlyPayment = actualLoan / numPayments
          } else {
            monthlyPayment = actualLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                            (Math.pow(1 + monthlyRate, numPayments) - 1)
          }
        }
        
        // 이미지 URL 처리
        const imageUrls = (item.images && Array.isArray(item.images) && item.images.length > 0) 
          ? item.images.join(', ') 
          : ''
        
        excelData.push([
          index + 1,
          item.category || '',
          item.region || '',
          item.rooms || 0,
          item.bathrooms || 0,
          item.price || 0,
          balance,
          monthlyPayment > 0 ? Math.round(monthlyPayment) : 0,
          item.preference === 2 ? '상' : item.preference === 1 ? '중' : '하',
          imageUrls,
          item.url || '',
          item.note || '',
        ])
      })

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // 컬럼 너비 설정
      const colWidths = [
        { wch: 8 },   // 번호
        { wch: 10 },  // 구분
        { wch: 15 },  // 지역
        { wch: 8 },   // 방
        { wch: 10 },  // 화장실
        { wch: 18 },  // 가격
        { wch: 18 },  // 잔액
        { wch: 15 },  // 월납입금
        { wch: 10 },  // 선호도
        { wch: 50 },  // 이미지
        { wch: 40 },  // URL
        { wch: 30 },  // 비고
      ]
      ws['!cols'] = colWidths

      // 헤더 행 병합 (제목만 병합)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // 제목 행만 병합
      ]

      // 숫자 포맷 설정
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let row = 6; row <= range.e.r; row++) {
        // 가격 컬럼 (F열, 인덱스 5)
        const priceCell = XLSX.utils.encode_cell({ r: row, c: 5 })
        if (ws[priceCell]) {
          ws[priceCell].z = '#,##0'
        }
        // 잔액 컬럼 (G열, 인덱스 6)
        const balanceCell = XLSX.utils.encode_cell({ r: row, c: 6 })
        if (ws[balanceCell]) {
          ws[balanceCell].z = '#,##0'
        }
        // 월납입금 컬럼 (H열, 인덱스 7)
        const monthlyCell = XLSX.utils.encode_cell({ r: row, c: 7 })
        if (ws[monthlyCell]) {
          ws[monthlyCell].z = '#,##0'
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, '부동산')
      const fileName = `부동산_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error: any) {
      alert(error.response?.data?.error || '엑셀 다운로드 중 오류가 발생했습니다.')
    }
  }

  // 카테고리 목록 (필터용)
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category)))
    return uniqueCategories.sort()
  }, [items])

  // 지역 목록 (필터용)
  const regions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(items.map(item => item.region)))
    return uniqueRegions.sort()
  }, [items])

  // 인라인 편집 행 컴포넌트
  const InlineEditRow = ({
    item,
    onSave,
    onCancel,
    onChange,
    showSaveButton = true,
    isNewRow = false,
    loanInfo: loanInfoProp,
    calculateMonthlyPayment: calcMonthlyPayment,
  }: {
    item?: Partial<RealEstate> | RealEstate
    onSave?: (data: Partial<RealEstate>) => void
    onCancel?: () => void
    onChange?: (data: Partial<RealEstate>) => void
    showSaveButton?: boolean
    isNewRow?: boolean
    loanInfo: typeof loanInfo
    calculateMonthlyPayment: (price: number) => number
  }) => {
    // useRef로 초기값을 고정 (컴포넌트가 재생성되어도 유지)
    const initialFormDataRef = useRef({
      category: item?.category || '',
      region: item?.region || '',
      rooms: item?.rooms?.toString() || '0',
      bathrooms: item?.bathrooms?.toString() || '0',
      price: item?.price?.toString() || '0',
      preference: item?.preference?.toString() || '1',
      images: (item?.images || []) as string[],
      url: item?.url || '',
      note: item?.note || '',
    })

    const [formData, setFormData] = useState(initialFormDataRef.current)
    const [imageUrls, setImageUrls] = useState<string[]>(initialFormDataRef.current.images)

    // item이 변경되면 imageUrls 업데이트 (수정 모드일 때)
    useEffect(() => {
      if (item && 'images' in item && Array.isArray(item.images)) {
        setImageUrls(item.images)
      } else if (!item) {
        setImageUrls([])
      }
    }, [item])

    // 구분 옵션
    const categories = ['매매', '전세', '월세', '기타']

    // onChange 모드 (실시간 업데이트) - 한글 입력 시 커서 유지를 위해 로컬 상태만 업데이트
    const handleChange = useCallback((field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!formData.category || !formData.region) {
        alert('구분과 지역은 필수입니다.')
        return
      }
      
      const preferenceValue = parseInt(formData.preference)
      const saveData = {
        ...(item && 'id' in item && item.id ? { id: item.id } : {}),
        category: formData.category,
        region: formData.region,
        rooms: parseInt(formData.rooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        price: parseInt(formData.price) || 0,
        preference: isNaN(preferenceValue) ? 1 : preferenceValue,
        images: imageUrls.filter(url => url && url.trim()).slice(0, 5),
        url: formData.url || null,
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
        <td className="px-2 py-1.5 text-center text-xs text-slate-500">-</td>
        <td className="px-3 py-2">
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
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
          <input
            type="text"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
            placeholder="지역 입력"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={formData.rooms}
            onChange={(e) => handleChange('rooms', e.target.value)}
            placeholder="0"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={formData.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            placeholder="0"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value
              const numValue = parseInt(value) || 0
              // 100억(10,000,000,000) 이상 입력 방지
              if (value === '' || numValue <= 10000000000) {
                handleChange('price', value)
              }
            }}
            placeholder="0"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-right"
            min="0"
            max="10000000000"
          />
        </td>
        <td className="px-3 py-2 text-right text-xs text-gray-600">
          {(loanInfoProp.ownMoney + loanInfoProp.loanAmount - (parseInt(formData.price) || 0)).toLocaleString('ko-KR')}원
        </td>
        <td className="px-3 py-2 text-right text-xs text-gray-600">
          {(() => {
            const price = parseInt(formData.price) || 0
            const monthlyPayment = calcMonthlyPayment(price)
            return monthlyPayment > 0
              ? `${Math.round(monthlyPayment).toLocaleString('ko-KR')}원`
              : '-'
          })()}
        </td>
        <td className="px-3 py-2">
          <select
            value={formData.preference}
            onChange={(e) => handleChange('preference', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="0">하</option>
            <option value="1">중</option>
            <option value="2">상</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="space-y-2">
            {/* 업로드된 이미지 미리보기 */}
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  {url && (
                    <img
                      src={url}
                      alt={`미리보기 ${idx + 1}`}
                      className="w-12 h-12 object-cover rounded border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfjILwn4yC8J+MgjwvdGV4dD48L3N2Zz4='
                      }}
                    />
                  )}
                  <span className="text-xs text-gray-600 truncate flex-1 min-w-0" title={url || ''}>
                    {truncateImagePath(url)}
                  </span>
                </div>
                <ButtonDelete
                  onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                  className="px-2 py-1 text-white bg-red-500 hover:bg-red-600 border-0"
                >
                  삭제
                </ButtonDelete>
              </div>
            ))}
            {/* 파일 선택 */}
            {imageUrls.length < 5 && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // 파일 크기 체크 (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      alert('파일 크기는 10MB를 초과할 수 없습니다.')
                      return
                    }

                    // 파일 타입 체크
                    if (!file.type.startsWith('image/')) {
                      alert('이미지 파일만 업로드할 수 있습니다.')
                      return
                    }

                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      
                      // 수정 모드일 때 realEstateId 전달
                      if (item && 'id' in item && item.id) {
                        formData.append('realEstateId', item.id)
                      }

                      const token = useWeddingStore.getState().token
                      const response = await fetch('/api/real-estate/upload-image', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                        body: formData,
                      })

                      const data = await response.json()

                      if (response.ok && data.url) {
                        setImageUrls([...imageUrls, data.url])
                      } else {
                        alert(data.error || '이미지 업로드에 실패했습니다.')
                      }
                    } catch (error) {
                      console.error('Image upload error:', error)
                      alert('이미지 업로드 중 오류가 발생했습니다.')
                    } finally {
                      // input 초기화
                      e.target.value = ''
                    }
                  }}
                />
                <span className="inline-block w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer text-center">
                  + 이미지 업로드
                </span>
              </label>
            )}
          </div>
        </td>
        <td className="px-4 py-2">
          <input
            type="url"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          />
        </td>
        <td className="px-4 py-2">
          <textarea
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="비고"
            rows={3}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-y"
          />
        </td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2 text-center">
          {showSaveButton && onSave && (
            <ButtonSave onClick={() => handleSubmit()} className="mr-2" />
          )}
          {onCancel && <ButtonCancel onClick={() => onCancel()} />}
        </td>
      </tr>
    )
  }

  // 테이블 행 컴포넌트
  const TableRow = ({ item, index }: { item: RealEstate; index: number }) => {
    if (editingId === item.id) {
      return (
        <InlineEditRow
          item={item}
          onSave={(data) => handleSave({ ...data, id: item.id })}
          onCancel={handleCancelEdit}
          loanInfo={loanInfo}
          calculateMonthlyPayment={calculateMonthlyPayment}
        />
      )
    }

    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <td className="px-2 py-1.5 text-center text-xs text-slate-700">{index + 1}</td>
        <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
          {item.category}
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
          {item.region}
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-gray-900">
          {item.rooms}개
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-gray-900">
          {item.bathrooms}개
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-right font-medium text-gray-900">
          {item.price.toLocaleString('ko-KR')}원
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-right font-medium">
          <span className={cn(
            (loanInfo.ownMoney + loanInfo.loanAmount - item.price) >= 0
              ? 'text-green-600'
              : 'text-red-600'
          )}>
            {(loanInfo.ownMoney + loanInfo.loanAmount - item.price).toLocaleString('ko-KR')}원
          </span>
        </td>
        <td className="px-3 py-3 whitespace-nowrap text-xs text-right font-medium text-gray-900">
          {calculateMonthlyPayment(item.price) > 0
            ? `${Math.round(calculateMonthlyPayment(item.price)).toLocaleString('ko-KR')}원`
            : '-'}
        </td>
        <td className="px-3 py-3 text-center">
          <span className={cn('text-xs', 
            item.preference === 2 ? 'text-red-600 font-semibold' :
            item.preference === 1 ? 'text-orange-600' :
            'text-gray-600'
          )}>
            {item.preference === 2 ? '상' : item.preference === 1 ? '중' : '하'}
          </span>
        </td>
        <td className="px-3 py-3 text-center">
          {item.images && item.images.length > 0 ? (
            <button
              onClick={() => {
                setSelectedImages(item.images)
                setShowImageModal(true)
              }}
              className="text-blue-600 hover:text-blue-900 text-xs underline"
            >
              이미지 ({item.images.length})
            </button>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 truncate" title={item.url || ''}>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-900 underline"
            >
              링크
            </a>
          ) : (
            '-'
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600" title={item.note || ''}>
          {item.note && item.note.length > 25 
            ? `${item.note.substring(0, 25)}...` 
            : (item.note || '-')}
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

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-4">
      {/* 대출 정보 설정 */}
      <CollapsibleSection title="대출 정보 설정" minimal compactDesktop>
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">대출 정보 설정</h3>
          {editingLoanInfo ? (
            <ButtonSecondary
              onClick={() => {
                setEditingLoanInfo(false)
                setTempLoanInfo({
                  ownMoney: loanInfo.ownMoney.toString(),
                  loanAmount: loanInfo.loanAmount.toString(),
                  loanRate: loanInfo.loanRate.toString(),
                  loanPeriod: loanInfo.loanPeriod.toString(),
                })
              }}
              className="px-3 py-1.5 rounded-lg"
            >
              취소
            </ButtonSecondary>
          ) : (
            <ButtonEdit
              onClick={() => setEditingLoanInfo(true)}
              className="px-3 py-1.5 rounded-lg"
            >
              수정
            </ButtonEdit>
          )}
        </div>
        {editingLoanInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                내 보유금
                <span className="ml-1 text-xs text-gray-500">(자동 계산)</span>
              </label>
              <input
                type="number"
                value={tempLoanInfo.ownMoney}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                min="0"
                disabled
                title="내 보유금은 현재 예산에서 결혼 준비 사용 금액을 뺀 값으로 자동 계산됩니다."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">내 대출금</label>
              <input
                type="number"
                value={tempLoanInfo.loanAmount}
                onChange={(e) => setTempLoanInfo({ ...tempLoanInfo, loanAmount: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">대출이율 (%)</label>
              <input
                type="number"
                value={tempLoanInfo.loanRate}
                onChange={(e) => setTempLoanInfo({ ...tempLoanInfo, loanRate: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">대출기간 (개월)</label>
              <input
                type="number"
                value={tempLoanInfo.loanPeriod}
                onChange={(e) => setTempLoanInfo({ ...tempLoanInfo, loanPeriod: e.target.value })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                min="0"
              />
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <ButtonPrimary onClick={handleLoanInfoUpdate} className="px-3 py-1.5 rounded-lg">저장</ButtonPrimary>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-600">내 보유금: </span>
              <span className="font-medium text-gray-900">{loanInfo.ownMoney.toLocaleString('ko-KR')}원</span>
            </div>
            <div>
              <span className="text-gray-600">내 대출금: </span>
              <span className="font-medium text-gray-900">{loanInfo.loanAmount.toLocaleString('ko-KR')}원</span>
            </div>
            <div>
              <span className="text-gray-600">대출이율: </span>
              <span className="font-medium text-gray-900">{loanInfo.loanRate.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-gray-600">대출기간: </span>
              <span className="font-medium text-gray-900">{loanInfo.loanPeriod}개월</span>
            </div>
          </div>
        )}
      </div>
      </CollapsibleSection>

      {/* 검색조건 및 액션 버튼 */}
      <CollapsibleSection title="검색조건" minimal compactDesktop defaultOpen={false}>
      <div className="bg-white rounded-xl shadow-lg p-2 md:p-3 border border-gray-200/50">
        <div className="flex flex-wrap items-center gap-2">
          <RealEstateFilters filters={filters} setFilters={setFilters} categories={categories} regions={regions} />
          <ButtonExportExcel onClick={handleExportExcel} />
        </div>
      </div>
      </CollapsibleSection>

      {/* 모바일: 카드 목록 */}
      <div className="md:hidden">
      <CollapsibleSection title="목록" minimal defaultOpen={false}>
      <div className="space-y-3">
        {items.length === 0 && newItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200/50 p-6 text-center text-sm text-gray-500">등록된 항목이 없습니다.</div>
        ) : (
          <>
            {paginatedItems.map((item, index) => (
              <div key={item.id} className="bg-white rounded-xl shadow border border-gray-200/50 p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">{item.category} · {item.region}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">방 {item.rooms} · 화장실 {item.bathrooms}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                      <span className="font-semibold text-gray-900">{item.price.toLocaleString('ko-KR')}원</span>
                      <span className={cn(
                        (loanInfo.ownMoney + loanInfo.loanAmount - item.price) >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        잔액 {(loanInfo.ownMoney + loanInfo.loanAmount - item.price).toLocaleString('ko-KR')}원
                      </span>
                      <span className="text-gray-500">{item.preference === 2 ? '선호 상' : item.preference === 1 ? '선호 중' : '선호 하'}</span>
                    </div>
                    {item.note ? <p className="text-xs text-gray-500 mt-1 truncate">{item.note}</p> : null}
                    {item.images && item.images.length > 0 && (
                      <button type="button" onClick={() => { setSelectedImages(item.images); setShowImageModal(true) }} className="mt-1 text-xs text-blue-600">이미지 ({item.images.length})</button>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <ButtonEdit onClick={() => handleInlineEdit(item)} className="px-2 py-1.5 bg-blue-50 rounded-lg" />
                    <ButtonDelete onClick={() => handleDelete(item.id)} className="px-2 py-1.5 bg-red-50 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
            {newItems.map((newItem, idx) => (
              <div key={`new-${idx}`} className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-sm text-amber-800">
                새 항목 입력 중 — 저장/취소는 아래 테이블에서 이용하거나 데스크톱에서 입력해 주세요.
              </div>
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

      {/* 테이블 - 컬럼 리사이즈 가능 (데스크톱 표시, 모바일은 수정 시에만) */}
      <div className={cn('hidden md:block', editingId && 'block mt-4')}>
        <div className="bg-white rounded shadow overflow-hidden border border-slate-200">
          {editingId && (
            <p className="md:hidden px-2 py-2 text-xs text-slate-600 bg-blue-50 border-b border-blue-100">편집 중 — 좌우로 스크롤하여 수정 후 저장/취소 하세요.</p>
          )}
          <DataTable
            columns={REAL_ESTATE_COLUMNS}
            storageKey="real-estate-table-v2"
            minTableWidth={1600}
            fillContainer={false}
          >
            <tr className="bg-blue-50 border-b-2 border-blue-200">
              <td className="px-2 py-2 text-center text-xs text-slate-500">-</td>
              <td colSpan={13} className="px-2 py-2">
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
                loanInfo={loanInfo}
                calculateMonthlyPayment={calculateMonthlyPayment}
              />
            ))}

            {items.length === 0 && newItems.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-2 py-8 text-center text-xs text-slate-500">
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

      {/* 이미지 팝업 모달 */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">이미지 갤러리</h2>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              {selectedImages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">등록된 이미지가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedImages.map((imageUrl, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={imageUrl}
                        alt={`이미지 ${idx + 1}`}
                        className="w-full h-auto rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4yC8J+MgvCfjIIg7ZWc64KYPC90ZXh0Pjwvc3ZnPg=='
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
