import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { hashPassword } from '@/lib/utils/password'
import logger from '@/lib/logger'

/** POST: 관리자가 회원 비밀번호 초기화 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true },
    })
    if (!dbUser?.isAdmin) {
      return NextResponse.json({ error: '관리자만 비밀번호를 초기화할 수 있습니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : ''

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id },
    })

    if (!target || target.isDeleted) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const hashed = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    })

    logger.info(`Admin reset password for user: ${target.email} (${id})`)

    return NextResponse.json({ success: true, message: '비밀번호가 초기화되었습니다.' })
  } catch (error) {
    logger.error('Admin reset-password error:', error)
    return NextResponse.json(
      { error: '비밀번호 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
