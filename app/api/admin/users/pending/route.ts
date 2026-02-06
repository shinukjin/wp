import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

/** GET: 승인 대기 사용자 목록 (관리자만) */
export async function GET(request: Request) {
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
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const pending = await prisma.user.findMany({
      where: {
        approved: false,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users: pending })
  } catch (error) {
    logger.error('Admin pending users error:', error)
    return NextResponse.json(
      { error: '승인 대기 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
