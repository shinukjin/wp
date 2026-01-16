import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

// GET: 캘린더 데이터 조회 (결혼 준비 예정일)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // 현재 년도/월 또는 요청한 년도/월
    const now = new Date()
    const targetYear = year ? parseInt(year) : now.getFullYear()
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1

    // 해당 월의 시작일과 종료일
    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    // 예정일이 있는 결혼 준비 항목 조회
    const items = await prisma.weddingPrep.findMany({
      where: {
        userId: user.userId,
        isDeleted: false,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        category: true,
        content: true,
        amount: true,
        status: true,
        dueDate: true,
        priority: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // 날짜별로 그룹화
    const eventsByDate: Record<string, typeof items> = {}
    items.forEach(item => {
      if (item.dueDate) {
        const dateKey = item.dueDate.toISOString().split('T')[0]
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = []
        }
        eventsByDate[dateKey].push(item)
      }
    })

    return NextResponse.json({
      year: targetYear,
      month: targetMonth,
      events: eventsByDate,
    })
  } catch (error) {
    logger.error('Calendar get error:', error)
    return NextResponse.json(
      { error: '캘린더 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
