'use client'

import { useEffect, useState } from 'react'
import LoadingScreen from '@/components/ui/LoadingScreen'
import apiClient from '@/lib/api/client'

interface AdminUser {
  id: string
  email: string
  name: string | null
  approved: boolean
  isAdmin: boolean
  budget: number
  ownMoney: number
  loanAmount: number
  loanRate: number
  loanPeriod: number
  discordWebhookUrl: string | null
  isDeleted: boolean
  deletedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminUser>>({})
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get('/admin/users')
      setUsers(res.data.users || [])
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError('관리자만 접근할 수 있습니다.')
        return
      }
      setError(e.response?.data?.error || '회원 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id)
      await apiClient.post(`/admin/users/${id}/approve`)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, approved: true } : u))
      )
    } catch (e: any) {
      alert(e.response?.data?.error || '승인 처리 중 오류가 발생했습니다.')
    } finally {
      setApprovingId(null)
    }
  }

  const openResetModal = (user: AdminUser) => {
    setResetTarget(user)
    setNewPassword('')
    setResetError(null)
  }

  const closeResetModal = () => {
    setResetTarget(null)
    setNewPassword('')
    setResetError(null)
  }

  const handleResetPassword = async () => {
    if (!resetTarget) return
    if (newPassword.length < 6) {
      setResetError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    try {
      setResetting(true)
      setResetError(null)
      await apiClient.post(`/admin/users/${resetTarget.id}/reset-password`, {
        newPassword,
      })
      closeResetModal()
    } catch (e: any) {
      setResetError(
        e.response?.data?.error || '비밀번호 초기화 중 오류가 발생했습니다.'
      )
    } finally {
      setResetting(false)
    }
  }

  const openEditModal = (user: AdminUser) => {
    setEditTarget(user)
    setEditForm({
      email: user.email,
      name: user.name ?? '',
      approved: user.approved,
      isAdmin: user.isAdmin,
      budget: user.budget,
      ownMoney: user.ownMoney,
      loanAmount: user.loanAmount,
      loanRate: user.loanRate,
      loanPeriod: user.loanPeriod,
      discordWebhookUrl: user.discordWebhookUrl ?? '',
    })
    setEditError(null)
  }

  const closeEditModal = () => {
    setEditTarget(null)
    setEditForm({})
    setEditError(null)
  }

  const handleEditSubmit = async () => {
    if (!editTarget) return
    try {
      setSaving(true)
      setEditError(null)
      await apiClient.patch(`/admin/users/${editTarget.id}`, {
        email: editForm.email,
        name: editForm.name === '' ? null : editForm.name,
        approved: editForm.approved,
        isAdmin: editForm.isAdmin,
        budget: Number(editForm.budget) || 0,
        ownMoney: Number(editForm.ownMoney) || 0,
        loanAmount: Number(editForm.loanAmount) || 0,
        loanRate: Number(editForm.loanRate) || 0,
        loanPeriod: Number(editForm.loanPeriod) || 0,
        discordWebhookUrl: editForm.discordWebhookUrl === '' ? null : editForm.discordWebhookUrl,
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? {
                ...u,
                ...editForm,
                name: editForm.name === '' ? null : editForm.name ?? u.name,
                discordWebhookUrl:
                  editForm.discordWebhookUrl === ''
                    ? null
                    : editForm.discordWebhookUrl ?? u.discordWebhookUrl,
                updatedAt: new Date().toISOString(),
              }
            : u
        )
      )
      closeEditModal()
    } catch (e: any) {
      setEditError(
        e.response?.data?.error || '회원 정보 수정 중 오류가 발생했습니다.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="회원 목록 로딩 중..." />
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          전체 회원 목록, 승인 및 비밀번호 초기화
        </p>
      </div>

      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 border-b border-[var(--app-border)]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">이메일</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">이름</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">승인</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">관리자</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">예산</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">보유금</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">대출금</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">대출이율(%)</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">대출기간(개월)</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">디스코드 웹훅</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">가입일</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">수정일시</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">최근 로그인</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">{u.email}</td>
                  <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">{u.name || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {u.approved ? (
                      <span className="text-xs text-green-600 font-medium">승인됨</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">대기</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {u.isAdmin ? (
                      <span className="text-xs text-blue-600 font-medium">관리자</span>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {u.budget.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {u.ownMoney.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {u.loanAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {u.loanRate}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {u.loanPeriod}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 max-w-[140px] truncate" title={u.discordWebhookUrl || undefined}>
                    {u.discordWebhookUrl ? '설정됨' : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(u.updatedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                    >
                      수정
                    </button>
                    {!u.approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(u.id)}
                        disabled={approvingId === u.id}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === u.id ? '처리 중...' : '승인'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openResetModal(u)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                    >
                      비밀번호 초기화
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 회원 정보 수정 모달 */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">회원 정보 수정</h3>
            <p className="mt-1 text-sm text-gray-500">ID: {editTarget.id}</p>
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-600">이메일</label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">이름</label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.approved ?? false}
                    onChange={(e) => setEditForm((f) => ({ ...f, approved: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">승인됨</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isAdmin ?? false}
                    onChange={(e) => setEditForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">관리자</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">예산</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.budget ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, budget: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">보유금</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.ownMoney ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, ownMoney: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">대출금</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.loanAmount ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, loanAmount: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">대출이율(%)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={editForm.loanRate ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, loanRate: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">대출기간(개월)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.loanPeriod ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, loanPeriod: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">디스코드 웹훅 URL</label>
                <input
                  type="url"
                  value={editForm.discordWebhookUrl ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, discordWebhookUrl: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 초기화 모달 */}
      {resetTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeResetModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              비밀번호 초기화
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {resetTarget.email} ({resetTarget.name || '-'})
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              autoFocus
            />
            {resetError && (
              <p className="mt-2 text-sm text-red-600">{resetError}</p>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {resetting ? '처리 중...' : '초기화'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
