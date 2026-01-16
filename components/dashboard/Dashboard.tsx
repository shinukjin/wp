'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import Link from 'next/link'

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
    <div className="space-y-6">
      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200/50">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">현재 예산</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 whitespace-nowrap">{formatCurrency(data.budget)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200/50">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">사용 금액</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 whitespace-nowrap">{formatCurrency(data.weddingPrepAmount)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200/50">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">내 보유금</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 whitespace-nowrap">{formatCurrency(data.ownMoney)}원</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200/50">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">대출금액</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 whitespace-nowrap">{formatCurrency(data.loanAmount)}원</p>
          </div>
        </div>
      </div>

      {/* 예산 사용률 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200/50">
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
          <div className="flex justify-between text-sm text-gray-600">
            <span className="whitespace-nowrap">남은 예산: {formatCurrency(remainingBudget)}원</span>
            <span className="whitespace-nowrap">사용 금액: {formatCurrency(data.weddingPrepAmount)}원 / {formatCurrency(data.budget)}원</span>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상태별 통계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900">상태별 통계</h3>
            <Link
              href="/wedding-prep"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              자세히 보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {data.statusStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${getStatusColor(stat.status)}`}>
                    {stat.status}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">{stat.count}건</span>
                </div>
                <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(stat.amount)}원</span>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 통계 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-gray-900">카테고리별 통계</h3>
            <Link
              href="/wedding-prep"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              자세히 보기 →
            </Link>
          </div>
          <div className="space-y-3">
            {data.categoryStats.slice(0, 5).map((stat) => (
              <div key={stat.category} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{stat.category}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">({stat.count}건)</span>
                </div>
                <span className="font-bold text-gray-900 whitespace-nowrap">{formatCurrency(stat.amount)}원</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 대출 정보 */}
      {data.loanAmount > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200/50">
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

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/wedding-prep"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200/50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">결혼 준비</p>
              <p className="text-sm text-gray-600">항목 관리</p>
            </div>
          </div>
        </Link>

        <Link
          href="/real-estate"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200/50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">부동산</p>
              <p className="text-sm text-gray-600">{data.realEstateCount}개 항목</p>
            </div>
          </div>
        </Link>

        <Link
          href="/my-info"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200/50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">내 정보</p>
              <p className="text-sm text-gray-600">계정 관리</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
