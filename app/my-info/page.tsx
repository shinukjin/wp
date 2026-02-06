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
  discordWebhookUrl?: string | null
  createdAt: string
  lastLoginAt: string | null
  weddingPrepAmount?: number // 결혼 준비 사용 금액
}

interface ConnectionPartner {
  id: string
  email: string
  name?: string
}

interface PendingRequest {
  id: string
  fromUserId: string
  fromUser: { id: string; email: string; name?: string }
  createdAt: string
}

export default function MyInfoPage() {
  const { token } = useWeddingStore()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editType, setEditType] = useState<'password' | 'budget' | 'loan' | null>(null)
  const [connectionPartner, setConnectionPartner] = useState<ConnectionPartner | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [partnerIdInput, setPartnerIdInput] = useState('')
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [discordUrl, setDiscordUrl] = useState('')
  const [discordSaving, setDiscordSaving] = useState(false)
  const [discordEditMode, setDiscordEditMode] = useState(false)
  const [sendRemindersLoading, setSendRemindersLoading] = useState(false)
  const [idCopied, setIdCopied] = useState(false)

  useEffect(() => {
    if (token) {
      fetchUserInfo()
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchConnection()
      fetchPendingRequests()
    }
  }, [token])

  useEffect(() => {
    if (userInfo?.discordWebhookUrl !== undefined) {
      setDiscordUrl(userInfo.discordWebhookUrl || '')
      setDiscordEditMode(false)
    }
  }, [userInfo?.discordWebhookUrl])

  const fetchConnection = async () => {
    try {
      const res = await apiClient.get('/connection')
      setConnectionPartner(res.data.partner ?? null)
    } catch {
      setConnectionPartner(null)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const res = await apiClient.get('/connection/requests')
      setPendingRequests(res.data.items ?? [])
    } catch {
      setPendingRequests([])
    }
  }

  const handleSendConnectionRequest = async () => {
    const toUserId = partnerIdInput.trim()
    if (!toUserId) {
      alert('상대방 ID를 입력해주세요.')
      return
    }
    setConnectionLoading(true)
    try {
      await apiClient.post('/connection', { toUserId })
      alert('연결 신청을 보냈습니다.')
      setPartnerIdInput('')
    } catch (err: any) {
      alert(err.response?.data?.error || '신청 중 오류가 발생했습니다.')
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    setConnectionLoading(true)
    try {
      await apiClient.post(`/connection/requests/${requestId}`, { action: 'approve' })
      alert('연결되었습니다.')
      fetchConnection()
      fetchPendingRequests()
    } catch (err: any) {
      alert(err.response?.data?.error || '처리 중 오류가 발생했습니다.')
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setConnectionLoading(true)
    try {
      await apiClient.post(`/connection/requests/${requestId}`, { action: 'reject' })
      fetchPendingRequests()
    } catch (err: any) {
      alert(err.response?.data?.error || '처리 중 오류가 발생했습니다.')
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('연결을 해제하시겠습니까?')) return
    setConnectionLoading(true)
    try {
      await apiClient.post('/connection/disconnect')
      alert('연결이 해제되었습니다.')
      setConnectionPartner(null)
    } catch (err: any) {
      alert(err.response?.data?.error || '해제 중 오류가 발생했습니다.')
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleSaveDiscord = async () => {
    setDiscordSaving(true)
    try {
      await apiClient.patch('/user', { discordWebhookUrl: discordUrl.trim() || null })
      alert('저장되었습니다.')
      setDiscordEditMode(false)
      fetchUserInfo()
    } catch (err: any) {
      alert(err.response?.data?.error || '저장 중 오류가 발생했습니다.')
    } finally {
      setDiscordSaving(false)
    }
  }

  const handleEditDiscord = () => {
    setDiscordEditMode(true)
  }

  const handleDeleteDiscord = async () => {
    if (!confirm('디스코드 웹훅을 삭제하시겠습니까?')) return
    setDiscordSaving(true)
    try {
      await apiClient.patch('/user', { discordWebhookUrl: null })
      alert('삭제되었습니다.')
      setDiscordEditMode(false)
      setDiscordUrl('')
      fetchUserInfo()
    } catch (err: any) {
      alert(err.response?.data?.error || '삭제 중 오류가 발생했습니다.')
    } finally {
      setDiscordSaving(false)
    }
  }

  const handleCopyId = async () => {
    if (!userInfo?.id) return
    try {
      await navigator.clipboard.writeText(userInfo.id)
      setIdCopied(true)
      setTimeout(() => setIdCopied(false), 2000)
    } catch {
      alert('복사에 실패했습니다.')
    }
  }

  const handleSendReminders = async () => {
    setSendRemindersLoading(true)
    try {
      const res = await apiClient.post('/notifications/send-reminders')
      alert(res.data?.message || '전송 완료')
    } catch (err: any) {
      alert(err.response?.data?.error || '전송 중 오류가 발생했습니다.')
    } finally {
      setSendRemindersLoading(false)
    }
  }

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
    <Container maxWidth="md" className="py-4 sm:py-6">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">내 정보</h1>
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
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-sm text-gray-600">마지막 로그인</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(userInfo.lastLoginAt)}</span>
            </div>
            <div className="flex justify-between items-center gap-2 py-1.5">
              <span className="text-sm text-gray-600 shrink-0">내 ID (연결 신청용)</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-mono text-gray-800 truncate">{userInfo.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title={idCopied ? '복사됨' : 'ID 복사'}
                  className="shrink-0 p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  {idCopied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 연결계정: 상대와 자료 공유 */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">연결계정</h2>
          <p className="text-xs text-gray-500 mb-3">상대방 ID로 신청을 보내고, 상대가 승인하면 작성한 자료(결혼준비·부동산·일정계획)가 서로 조회됩니다.</p>
          {connectionPartner ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-600">연결된 상대</span>
                <span className="text-sm font-medium text-gray-900">{connectionPartner.name || connectionPartner.email}</span>
              </div>
              <div className="text-xs text-gray-500">{connectionPartner.email}</div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={connectionLoading}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={partnerIdInput}
                  onChange={(e) => setPartnerIdInput(e.target.value)}
                  placeholder="상대방 ID 입력"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendConnectionRequest}
                  disabled={connectionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  신청 보내기
                </button>
              </div>
              {pendingRequests.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">받은 연결 신청</p>
                  <ul className="space-y-2">
                    {pendingRequests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{r.fromUser.name || r.fromUser.email}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(r.id)}
                            disabled={connectionLoading}
                            className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(r.id)}
                            disabled={connectionLoading}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            거절
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* 디스코드 알림 */}
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">디스코드 알림</h2>
          <p className="text-xs text-gray-500 mb-3">일정계획에서 알림을 켜 둔 일정을 전날·당일 오전 9시에 디스코드 웹훅으로 전송합니다. 연결된 상대가 있으면 둘 다 수신합니다.</p>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              disabled={!!userInfo?.discordWebhookUrl && !discordEditMode}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed ${!!userInfo?.discordWebhookUrl && !discordEditMode ? 'bg-gray-200 border-gray-300 text-gray-600' : 'border-gray-300'}`}
            />
            {!!userInfo?.discordWebhookUrl && !discordEditMode ? (
              <>
                <button
                  type="button"
                  onClick={handleEditDiscord}
                  disabled={discordSaving}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg disabled:opacity-50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDiscord}
                  disabled={discordSaving}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-50"
                >
                  삭제
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSaveDiscord}
                disabled={discordSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                저장
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSendReminders}
            disabled={sendRemindersLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {sendRemindersLoading ? '전송 중…' : '직접 보내기'}
          </button>
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
