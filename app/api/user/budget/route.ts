import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 현재 예산 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { budget: true },
    })

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // ETag 생성 (예산 데이터 기반)
    const etag = generateETag({ budget: userData.budget })

    // If-None-Match 헤더 확인 (조건부 요청)
    const ifNoneMatch = request.headers.get('If-None-Match')
    
    if (ifNoneMatch && compareETag(ifNoneMatch, etag)) {
      // 데이터 변경 없음 - 304 Not Modified 반환
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, no-cache, must-revalidate',
          'Vary': 'Authorization',
        },
      })
    }

    // 데이터 변경됨 또는 첫 요청 - 200 OK와 함께 데이터 반환
    const response = NextResponse.json({ budget: userData.budget })
    
    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate')
    response.headers.set('Vary', 'Authorization')

    return response
  } catch (error) {
    logger.error('Budget get error:', error)
    return NextResponse.json(
      { error: '예산을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 현재 예산 업데이트
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { budget } = body

    if (typeof budget !== 'number' || budget < 0) {
      return NextResponse.json(
        { error: '올바른 예산 금액을 입력해주세요.' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { budget },
      select: { budget: true },
    })

    logger.info(`Budget updated for user: ${user.userId}`)

    return NextResponse.json({ budget: updatedUser.budget })
  } catch (error) {
    logger.error('Budget update error:', error)
    return NextResponse.json(
      { error: '예산을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
