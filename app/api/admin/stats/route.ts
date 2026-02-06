import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

/** GET: 관리자 대시보드 통계 (당일 접속량, 전체 회원, 승인 대기 등) */
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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 당일 로그인 수 (LoginLog 기준, 당일 0시~현재)
    const dailyLoginCount = await prisma.loginLog.count({
      where: {
        createdAt: { gte: todayStart, lte: now },
      },
    })

    // 당일 접속 사용자 수 (당일에 로그인한 고유 사용자)
    const dailyLoginUserIds = await prisma.loginLog.findMany({
      where: { createdAt: { gte: todayStart, lte: now } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const dailyActiveUsers = dailyLoginUserIds.length

    // 전체 회원 수 (미삭제)
    const totalUsers = await prisma.user.count({
      where: { isDeleted: false },
    })

    // 승인 대기 수
    const pendingCount = await prisma.user.count({
      where: { isDeleted: false, approved: false },
    })

    // 승인 완료 수 (로그인 가능)
    const approvedCount = await prisma.user.count({
      where: { isDeleted: false, approved: true },
    })

    // 최근 7일 로그인 수
    const weeklyLoginCount = await prisma.loginLog.count({
      where: { createdAt: { gte: weekStart } },
    })

    return NextResponse.json({
      dailyLoginCount,
      dailyActiveUsers,
      totalUsers,
      pendingCount,
      approvedCount,
      weeklyLoginCount,
      at: now.toISOString(),
    })
  } catch (error) {
    logger.error('Admin stats error:', error)
    return NextResponse.json(
      { error: '통계를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
