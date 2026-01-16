'use client'

import { useEffect, useState } from 'react'
import Container from '@/components/layout/Container'
import apiClient from '@/lib/api/client'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import UserInfoEditModal from '@/components/my-info/UserInfoEditModal'

interface UserInfo {
  id: string
  email: string
  name: string | null
  budget: number
  ownMoney: number
  loanAmount: number
  loanRate: number
  loanPeriod: number
  createdAt: string
  lastLoginAt: string | null
  weddingPrepAmount?: number // 결혼 준비 사용 금액
}

export default function MyInfoPage() {
  const { token } = useWeddingStore()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editType, setEditType] = useState<'password' | 'budget' | 'loan' | null>(null)

  useEffect(() => {
    if (token) {
      fetchUserInfo()
    }
  }, [token])

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/user')
      setUserInfo(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '사용자 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleEdit = (type: 'password' | 'budget' | 'loan') => {
    setEditType(type)
    setEditModalOpen(true)
  }

  const handleModalClose = () => {
    setEditModalOpen(false)
    setEditType(null)
    fetchUserInfo() // 정보 새로고침
  }

  if (loading) {
    return (
      <Container maxWidth="md" className="py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" className="py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </Container>
    )
  }

  if (!userInfo) {
    return null
  }

  return (
    <Container maxWidth="md" className="py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">내 정보</h1>
      </div>

      <div className="space-y-4">
        {/* 계정 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">계정 정보</h2>
            <button
              onClick={() => handleEdit('password')}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              비밀번호 변경
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">이메일</span>
              <span className="text-sm font-medium text-gray-900">{userInfo.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">이름</span>
              <span className="text-sm font-medium text-gray-900">{userInfo.name || '-'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">가입일</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(userInfo.createdAt)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-600">마지막 로그인</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(userInfo.lastLoginAt)}</span>
            </div>
          </div>
        </div>

        {/* 예산 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">예산 정보</h2>
            <button
              onClick={() => handleEdit('budget')}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              수정
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">현재 예산</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(userInfo.budget)}원</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">결혼 준비 사용 금액</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(userInfo.weddingPrepAmount || 0)}원</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-600">내 보유금</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(userInfo.ownMoney)}원</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              (현재 예산 - 결혼 준비 사용 금액)
            </div>
          </div>
        </div>

        {/* 대출 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">대출 정보</h2>
            <button
              onClick={() => handleEdit('loan')}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              수정
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">대출금액</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(userInfo.loanAmount)}원</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">대출이율</span>
              <span className="text-sm font-medium text-gray-900">{userInfo.loanRate}%</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-600">대출기간</span>
              <span className="text-sm font-medium text-gray-900">{userInfo.loanPeriod}개월</span>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {editModalOpen && editType && (
        <UserInfoEditModal
          type={editType}
          currentData={userInfo}
          onClose={handleModalClose}
        />
      )}
    </Container>
  )
}
