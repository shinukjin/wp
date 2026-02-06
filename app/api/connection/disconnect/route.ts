import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

// POST: 연결 해제
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const conn = await prisma.connection.findFirst({
      where: {
        OR: [{ userId1: user.userId }, { userId2: user.userId }],
      },
    })

    if (!conn) {
      return NextResponse.json(
        { error: '연결된 상대가 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.connection.delete({
      where: { id: conn.id },
    })

    logger.info(`Connection disconnected: ${conn.userId1}, ${conn.userId2}`)
    return NextResponse.json({ success: true, message: '연결이 해제되었습니다.' })
  } catch (error) {
    logger.error('Connection disconnect error:', error)
    return NextResponse.json(
      { error: '연결 해제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
