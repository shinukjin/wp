import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import Container from '@/components/layout/Container'

export default function LoginPage() {
  return (
    <Container maxWidth="sm" className="py-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">로그인</h1>
          <p className="text-sm text-gray-600">
            Wedding Project에 오신 것을 환영합니다
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 border border-gray-200/50">
          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
