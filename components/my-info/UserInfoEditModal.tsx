'use client'

import { useState } from 'react'
import apiClient from '@/lib/api/client'

interface UserInfo {
  budget: number
  ownMoney: number
  loanAmount: number
  loanRate: number
  loanPeriod: number
}

interface UserInfoEditModalProps {
  type: 'password' | 'budget' | 'loan'
  currentData: Partial<UserInfo>
  onClose: () => void
}

export default function UserInfoEditModal({ type, currentData, onClose }: UserInfoEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 비밀번호 폼
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 예산 폼
  const [budget, setBudget] = useState(currentData.budget?.toString() || '0')

  // 대출 정보 폼
  const [ownMoney, setOwnMoney] = useState(currentData.ownMoney?.toString() || '0')
  const [loanAmount, setLoanAmount] = useState(currentData.loanAmount?.toString() || '0')
  const [loanRate, setLoanRate] = useState(currentData.loanRate?.toString() || '0')
  const [loanPeriod, setLoanPeriod] = useState(currentData.loanPeriod?.toString() || '0')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (type === 'password') {
        if (newPassword !== confirmPassword) {
          setError('새 비밀번호가 일치하지 않습니다.')
          setLoading(false)
          return
        }

        await apiClient.put('/user/password', {
          currentPassword,
          newPassword,
        })
      } else if (type === 'budget') {
        const budgetNum = parseInt(budget)
        if (isNaN(budgetNum) || budgetNum < 0) {
          setError('올바른 예산 금액을 입력해주세요.')
          setLoading(false)
          return
        }

        await apiClient.put('/user/budget', {
          budget: budgetNum,
        })
      } else if (type === 'loan') {
        const ownMoneyNum = parseInt(ownMoney)
        const loanAmountNum = parseInt(loanAmount)
        const loanRateNum = parseFloat(loanRate)
        const loanPeriodNum = parseInt(loanPeriod)

        if (isNaN(ownMoneyNum) || ownMoneyNum < 0) {
          setError('올바른 보유금액을 입력해주세요.')
          setLoading(false)
          return
        }

        if (isNaN(loanAmountNum) || loanAmountNum < 0) {
          setError('올바른 대출금액을 입력해주세요.')
          setLoading(false)
          return
        }

        if (isNaN(loanRateNum) || loanRateNum < 0 || loanRateNum > 100) {
          setError('올바른 대출이율을 입력해주세요. (0-100%)')
          setLoading(false)
          return
        }

        if (isNaN(loanPeriodNum) || loanPeriodNum < 0) {
          setError('올바른 대출기간을 입력해주세요.')
          setLoading(false)
          return
        }

        await apiClient.put('/user/loan', {
          ownMoney: ownMoneyNum,
          loanAmount: loanAmountNum,
          loanRate: loanRateNum,
          loanPeriod: loanPeriodNum,
        })
      }

      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || '수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'password':
        return '비밀번호 변경'
      case 'budget':
        return '예산 수정'
      case 'loan':
        return '대출 정보 수정'
      default:
        return '정보 수정'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* 모달 위치 조정 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* 모달 컨텐츠 */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/50">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{getTitle()}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  <span className="sr-only">닫기</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {type === 'password' && (
                  <>
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        현재 비밀번호
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        새 비밀번호
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">최소 6자 이상 입력해주세요.</p>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}

                {type === 'budget' && (
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                      현재 예산 (원)
                    </label>
                    <input
                      type="number"
                      id="budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      step="1"
                    />
                  </div>
                )}

                {type === 'loan' && (
                  <>
                    <div>
                      <label htmlFor="ownMoney" className="block text-sm font-medium text-gray-700 mb-1">
                        내 보유금 (원)
                      </label>
                      <input
                        type="number"
                        id="ownMoney"
                        value={ownMoney}
                        onChange={(e) => setOwnMoney(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        대출금액 (원)
                      </label>
                      <input
                        type="number"
                        id="loanAmount"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="loanRate" className="block text-sm font-medium text-gray-700 mb-1">
                        대출이율 (%)
                      </label>
                      <input
                        type="number"
                        id="loanRate"
                        value={loanRate}
                        onChange={(e) => setLoanRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <p className="mt-1 text-xs text-gray-500">0-100 사이의 값을 입력해주세요.</p>
                    </div>
                    <div>
                      <label htmlFor="loanPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                        대출기간 (개월)
                      </label>
                      <input
                        type="number"
                        id="loanPeriod"
                        value={loanPeriod}
                        onChange={(e) => setLoanPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                        min="0"
                        step="1"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-md px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-base font-semibold text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
