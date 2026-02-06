import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getSharedUserIds } from '@/lib/utils/connection'
import logger from '@/lib/logger'

// GET: 단일 여행 일정 조회 (연결 시 상대 자료도 조회 가능)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const userIds = await getSharedUserIds(user.userId)

    const item = await prisma.travelSchedule.findFirst({
      where: {
        id,
        userId: { in: userIds },
        isDeleted: false,
      },
    })

    if (!item) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Travel schedule get error:', error)
    return NextResponse.json(
      { error: '일정을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 여행 일정 수정 (본인 일정만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.travelSchedule.findFirst({
      where: {
        id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await request.json()
    const { title, dueDate, note, remindEnabled } = body

    const item = await prisma.travelSchedule.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        note: note !== undefined ? note : existing.note,
        remindEnabled: remindEnabled !== undefined ? !!remindEnabled : existing.remindEnabled,
      },
    })

    logger.info(`Travel schedule updated: ${item.id}`)

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Travel schedule update error:', error)
    return NextResponse.json(
      { error: '일정 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 여행 일정 삭제 (소프트 삭제, 본인 일정만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.travelSchedule.findFirst({
      where: {
        id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: '일정을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.travelSchedule.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    })

    logger.info(`Travel schedule deleted: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Travel schedule delete error:', error)
    return NextResponse.json(
      { error: '일정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
