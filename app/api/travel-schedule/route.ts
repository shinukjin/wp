import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getSharedUserIds } from '@/lib/utils/connection'
import logger from '@/lib/logger'

// GET: 여행 일정 목록 조회 (연결된 상대와 공유 시 둘 다 조회)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userIds = await getSharedUserIds(user.userId)

    const all = await prisma.travelSchedule.findMany({
      where: {
        userId: { in: userIds },
        isDeleted: false,
      },
      orderBy: { dueDate: 'asc' },
      include: {
        updatedBy: { select: { email: true, name: true } },
      },
    })

    // 오늘(KST) 기준으로 오늘 이후 일정 먼저, 지난 일정은 뒤로
    const kstNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const todayStart = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate())
    const futureOrToday = all.filter((i) => i.dueDate && new Date(i.dueDate) >= todayStart)
    const past = all.filter((i) => !i.dueDate || new Date(i.dueDate) < todayStart)
    const items = [...futureOrToday, ...past]

    return NextResponse.json({ items })
  } catch (error) {
    logger.error('Travel schedule list error:', error)
    return NextResponse.json(
      { error: '여행 일정을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 여행 일정 추가
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, dueDate, note, remindEnabled } = body

    if (!title) {
      return NextResponse.json(
        { error: '일정 제목은 필수입니다.' },
        { status: 400 }
      )
    }

    const item = await prisma.travelSchedule.create({
      data: {
        userId: user.userId,
        updatedById: user.userId,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note ?? null,
        remindEnabled: remindEnabled !== undefined ? !!remindEnabled : true,
      },
      include: {
        updatedBy: { select: { email: true, name: true } },
      },
    })

    logger.info(`Travel schedule created: ${item.id}`)

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Travel schedule create error:', error)
    return NextResponse.json(
      { error: '여행 일정 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
