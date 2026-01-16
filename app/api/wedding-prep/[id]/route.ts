import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

// GET: 단일 항목 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const item = await prisma.weddingPrep.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!item) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Wedding prep get error:', error)
    return NextResponse.json(
      { error: '항목을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { category, subCategory, content, amount, status, priority, dueDate, note, completedAt } = body

    // 기존 항목 확인
    const existingItem = await prisma.weddingPrep.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 완료일 처리 (상태가 완료로 변경될 때)
    let finalCompletedAt = existingItem.completedAt
    if (status === '완료' && !existingItem.completedAt) {
      finalCompletedAt = new Date()
    } else if (status !== '완료') {
      finalCompletedAt = null
    } else if (completedAt) {
      finalCompletedAt = new Date(completedAt)
    }

    const item = await prisma.weddingPrep.update({
      where: { id: params.id },
      data: {
        category: category !== undefined ? category : existingItem.category,
        subCategory: subCategory !== undefined ? subCategory : existingItem.subCategory,
        content: content !== undefined ? content : existingItem.content,
        amount: amount !== undefined ? amount : existingItem.amount,
        status: status !== undefined ? status : existingItem.status,
        priority: priority !== undefined ? priority : existingItem.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingItem.dueDate,
        note: note !== undefined ? note : existingItem.note,
        completedAt: finalCompletedAt,
      },
    })

    logger.info(`Wedding prep item updated: ${item.id}`)

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Wedding prep update error:', error)
    return NextResponse.json(
      { error: '항목을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 항목 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const existingItem = await prisma.weddingPrep.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.weddingPrep.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    logger.info(`Wedding prep item deleted: ${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Wedding prep delete error:', error)
    return NextResponse.json(
      { error: '항목을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
