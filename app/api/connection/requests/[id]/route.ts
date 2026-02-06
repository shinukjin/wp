import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getConnectedPartnerId } from '@/lib/utils/connection'
import logger from '@/lib/logger'

// POST: 승인 또는 거절. body: { action: 'approve' | 'reject' }
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

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body.action === 'reject' ? 'reject' : 'approve'

    const req = await prisma.connectionRequest.findFirst({
      where: {
        id,
        toUserId: user.userId,
        status: 'pending',
      },
    })

    if (!req) {
      return NextResponse.json(
        { error: '해당 신청을 찾을 수 없거나 이미 처리되었습니다.' },
        { status: 404 }
      )
    }

    if (action === 'reject') {
      await prisma.connectionRequest.update({
        where: { id },
        data: { status: 'rejected', updatedAt: new Date() },
      })
      logger.info(`Connection request rejected: ${id}`)
      return NextResponse.json({ success: true, message: '연결 신청을 거절했습니다.' })
    }

    // approve: 이미 연결된 상대가 있으면 안 됨
    const existing = await getConnectedPartnerId(user.userId)
    if (existing) {
      return NextResponse.json(
        { error: '이미 연결된 상대가 있습니다. 연결 해제 후 승인해주세요.' },
        { status: 400 }
      )
    }

    const fromUserId = req.fromUserId
    const toUserId = req.toUserId
    const userId1 = fromUserId < toUserId ? fromUserId : toUserId
    const userId2 = fromUserId < toUserId ? toUserId : fromUserId

    await prisma.$transaction([
      prisma.connectionRequest.update({
        where: { id },
        data: { status: 'accepted', updatedAt: new Date() },
      }),
      prisma.connection.upsert({
        where: {
          userId1_userId2: { userId1, userId2 },
        },
        create: { userId1, userId2 },
        update: {},
      }),
    ])

    logger.info(`Connection accepted: ${userId1}, ${userId2}`)
    return NextResponse.json({ success: true, message: '연결되었습니다.' })
  } catch (error) {
    logger.error('Connection request action error:', error)
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
