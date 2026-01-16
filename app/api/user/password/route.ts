import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { hashPassword, verifyPassword } from '@/lib/utils/password'
import logger from '@/lib/logger'

// PUT: 비밀번호 변경
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 비밀번호 길이 검증
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자 정보 조회
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { password: true },
    })

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 현재 비밀번호 검증
    const isPasswordValid = await verifyPassword(currentPassword, userData.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 새 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedPassword },
    })

    logger.info(`Password updated for user: ${user.userId}`)

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  } catch (error) {
    logger.error('Password update error:', error)
    return NextResponse.json(
      { error: '비밀번호를 변경하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
