import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'
import Container from '@/components/layout/Container'

export default function RegisterPage() {
  return (
    <Container maxWidth="sm" className="py-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-sm text-gray-600">
            Wedding Project에 가입하고 시작하세요
          </p>
        </div>

        <div className="bg-[var(--app-surface)] rounded-2xl shadow-lg p-5 sm:p-8 border border-[var(--app-border)]">
          <RegisterForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
