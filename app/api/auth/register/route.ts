import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/utils/password'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

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

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser && !existingUser.isDeleted) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password)

    // 사용자 생성 (승인 대기 상태)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        isDeleted: false,
        approved: false,
      },
    })

    logger.info(`New user registered (pending approval): ${user.email}`)

    // 승인 전에는 로그인 불가 — 토큰/쿠키 없이 성공만 반환
    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
        pendingApproval: true,
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('Registration error:', error)

    // Prisma 에러 처리
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
