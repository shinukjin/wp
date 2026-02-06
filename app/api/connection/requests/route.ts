import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

// GET: 내가 받은 연결 신청 목록 (pending만)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const list = await prisma.connectionRequest.findMany({
      where: { toUserId: user.userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    const items = list.map((r) => ({
      id: r.id,
      fromUserId: r.fromUserId,
      fromUser: {
        id: r.fromUser.id,
        email: r.fromUser.email,
        name: r.fromUser.name ?? undefined,
      },
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    logger.error('Connection requests list error:', error)
    return NextResponse.json(
      { error: '신청 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
