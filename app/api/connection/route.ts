import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getConnectedPartnerId } from '@/lib/utils/connection'
import logger from '@/lib/logger'

// GET: 내 연결 상태 (연결된 상대 정보 또는 null)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const partnerId = await getConnectedPartnerId(user.userId)
    if (!partnerId) {
      return NextResponse.json({ partner: null })
    }

    const partner = await prisma.user.findUnique({
      where: { id: partnerId, isDeleted: false },
      select: { id: true, email: true, name: true },
    })
    if (!partner) {
      return NextResponse.json({ partner: null })
    }

    return NextResponse.json({
      partner: {
        id: partner.id,
        email: partner.email,
        name: partner.name ?? undefined,
      },
    })
  } catch (error) {
    logger.error('Connection get error:', error)
    return NextResponse.json(
      { error: '연결 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 연결 신청 (상대방 ID로)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const toUserId = body.toUserId ?? body.partnerId ?? body.userId
    if (!toUserId || typeof toUserId !== 'string') {
      return NextResponse.json(
        { error: '상대방 ID(toUserId)를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (toUserId === user.userId) {
      return NextResponse.json(
        { error: '본인에게는 연결 신청할 수 없습니다.' },
        { status: 400 }
      )
    }

    const toUser = await prisma.user.findUnique({
      where: { id: toUserId, isDeleted: false },
    })
    if (!toUser) {
      return NextResponse.json(
        { error: '해당 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const existing = await getConnectedPartnerId(user.userId)
    if (existing) {
      return NextResponse.json(
        { error: '이미 연결된 상대가 있습니다. 연결 해제 후 신청해주세요.' },
        { status: 400 }
      )
    }

    const existingRequest = await prisma.connectionRequest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: user.userId, toUserId },
      },
    })
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: '이미 보낸 신청이 있습니다.' },
          { status: 400 }
        )
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: '이미 연결된 상태입니다.' },
          { status: 400 }
        )
      }
    }

    await prisma.connectionRequest.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: user.userId, toUserId },
      },
      create: {
        fromUserId: user.userId,
        toUserId,
        status: 'pending',
      },
      update: { status: 'pending', updatedAt: new Date() },
    })

    logger.info(`Connection request sent: ${user.userId} -> ${toUserId}`)
    return NextResponse.json({ success: true, message: '연결 신청을 보냈습니다.' })
  } catch (error) {
    logger.error('Connection request error:', error)
    return NextResponse.json(
      { error: '연결 신청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
