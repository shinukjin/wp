'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useWeddingStore } from '@/lib/store/useWeddingStore'
import apiClient from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

interface RegisterFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  name?: string
  general?: string
}

export default function RegisterForm() {
  const router = useRouter()
  const { login } = useWeddingStore()
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {}

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
    }

    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
      })

      const { pendingApproval, message } = response.data

      // 승인 대기 시 로그인 없이 성공 메시지 후 로그인 페이지로 이동
      if (pendingApproval) {
        setErrors({})
        setSuccessMessage(message || '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.')
        setTimeout(() => {
          router.push('/login')
          router.refresh()
        }, 2500)
        return
      }

      const { token, user } = response.data
      login(user, token)
      router.push('/')
      router.refresh()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || '회원가입 중 오류가 발생했습니다.'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // 해당 필드의 에러 제거
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 승인 대기 성공 메시지 */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
          <p className="mt-1 text-xs text-green-600">잠시 후 로그인 페이지로 이동합니다.</p>
        </div>
      )}
      {/* 일반 에러 메시지 */}
      {errors.general && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      {/* 이름 입력 (선택사항) */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          이름 <span className="text-gray-400">(선택사항)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.name
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )}
          placeholder="홍길동"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* 이메일 입력 */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.email
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )}
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.password
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )}
          placeholder="최소 6자 이상"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* 비밀번호 확인 입력 */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.confirmPassword
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )}
          placeholder="비밀번호를 다시 입력하세요"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* 회원가입 버튼 */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-lg'
        )}
      >
        {isLoading ? '회원가입 중...' : '회원가입'}
      </button>
    </form>
  )
}
