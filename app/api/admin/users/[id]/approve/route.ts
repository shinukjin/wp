import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

/** POST: 사용자 승인 (관리자만) */
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

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true },
    })
    if (!dbUser?.isAdmin) {
      return NextResponse.json({ error: '관리자만 승인할 수 있습니다.' }, { status: 403 })
    }

    const { id } = await params

    const target = await prisma.user.findUnique({
      where: { id },
    })

    if (!target || target.isDeleted) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (target.approved) {
      return NextResponse.json({ error: '이미 승인된 사용자입니다.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id },
      data: { approved: true },
    })

    logger.info(`User approved by admin: ${target.email} (${id})`)

    return NextResponse.json({ success: true, message: '승인되었습니다.' })
  } catch (error) {
    logger.error('Admin approve error:', error)
    return NextResponse.json(
      { error: '승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
