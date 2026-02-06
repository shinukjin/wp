import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

/** GET: 전체 회원 목록 (관리자만, 비밀번호 제외) */
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

    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        name: true,
        approved: true,
        isAdmin: true,
        budget: true,
        ownMoney: true,
        loanAmount: true,
        loanRate: true,
        loanPeriod: true,
        discordWebhookUrl: true,
        isDeleted: true,
        deletedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // password 제외
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    logger.error('Admin users list error:', error)
    return NextResponse.json(
      { error: '회원 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
