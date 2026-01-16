import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils/password'
import { generateToken } from '@/lib/utils/jwt'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // 사용자가 없거나 탈퇴한 경우
    if (!user || user.isDeleted) {
      logger.warn(`Login attempt with non-existent email: ${email}`)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for email: ${email}`)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    logger.info(`Successful login for user: ${user.email}`)

    // 응답 생성 및 쿠키 설정
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    )

    // 쿠키에 토큰 저장 (서버 컴포넌트에서 인증 상태 확인용)
    response.cookies.set('auth-token', token, {
      httpOnly: false, // 클라이언트에서도 접근 가능 (필요시 true로 변경)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Login error:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
