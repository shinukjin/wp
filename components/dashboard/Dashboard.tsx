'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useWeddingStore } from '@/lib/store/useWeddingStore'

interface DashboardData {
  budget: number
  ownMoney: number
  weddingPrepAmount: number
  loanAmount: number
  loanRate: number
  loanPeriod: number
  monthlyPayment: number
  statusStats: Array<{
    status: string
    amount: number
    count: number
  }>
  categoryStats: Array<{
    category: string
    amount: number
    count: number
  }>
  realEstateCount: number
}

export default function Dashboard() {
  const { token } = useWeddingStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/dashboard')
      setData(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '대시보드 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const remainingBudget = data.budget - data.weddingPrepAmount
  const usagePercentage = data.budget > 0 ? (data.weddingPrepAmount / data.budget) * 100 : 0

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* 모바일: 한 섹션에 4개 지표 (글씨 작게) */}
      <div className="md:hidden bg-white rounded-xl shadow-lg p-4 border border-gray-200/50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">요약</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[10px] text-gray-500">현재 예산</p>
            <p className="text-sm font-semibold text-gray-900 truncate" title={formatCurrency(data.budget)}>{formatCurrency(data.budget)}원</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">사용 금액</p>
            <p className="text-sm font-semibold text-gray-900 truncate" title={formatCurrency(data.weddingPrepAmount)}>{formatCurrency(data.weddingPrepAmount)}원</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">내 보유금</p>
            <p className="text-sm font-semibold text-gray-900 truncate" title={formatCurrency(data.ownMoney)}>{formatCurrency(data.ownMoney)}원</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">대출금액</p>
            <p className="text-sm font-semibold text-gray-900 truncate" title={formatCurrency(data.loanAmount)}>{formatCurrency(data.loanAmount)}원</p>
          </div>
        </div>
      </div>

      {/* 데스크톱: 주요 지표 4칸 */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200/50 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1">현재 예산</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate" title={formatCurrency(data.budget)}>{formatCurrency(data.budget)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200/50 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1">사용 금액</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate" title={formatCurrency(data.weddingPrepAmount)}>{formatCurrency(data.weddingPrepAmount)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200/50 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1">내 보유금</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate" title={formatCurrency(data.ownMoney)}>{formatCurrency(data.ownMoney)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200/50 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1">대출금액</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate" title={formatCurrency(data.loanAmount)}>{formatCurrency(data.loanAmount)}원</p>
          </div>
        </div>
      </div>

      {/* 예산 사용률 */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200/50">
        <h3 className="text-base font-semibold text-gray-900 mb-4">예산 사용 현황</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">사용률</span>
            <span className="font-bold text-gray-900">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5 shadow-inner">
            <div
              className={`h-5 rounded-full transition-all duration-500 shadow-md ${
                usagePercentage > 100 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : usagePercentage > 80 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="truncate">남은 예산: {formatCurrency(remainingBudget)}원</span>
            <span className="truncate">사용 금액: {formatCurrency(data.weddingPrepAmount)}원 / {formatCurrency(data.budget)}원</span>
          </div>
        </div>
      </div>

      {/* 대출 정보 */}
      {data.loanAmount > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200/50">
          <h3 className="text-base font-semibold text-gray-900 mb-4">대출 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600">월 상환액</p>
              <p className="text-lg font-bold text-gray-900 mt-1 whitespace-nowrap">{formatCurrency(data.monthlyPayment)}원</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">대출이율</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{data.loanRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">대출기간</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{data.loanPeriod}개월</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
