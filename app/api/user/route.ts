import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 사용자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // If-None-Match 헤더 확인 (조건부 요청)
    const ifNoneMatch = request.headers.get('If-None-Match')
    
    if (ifNoneMatch) {
      // 사용자 정보의 updatedAt 조회
      const userDataForETag = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          updatedAt: true,
        },
      })

      if (userDataForETag) {
        // 결혼 준비에서 최신 updatedAt 조회
        const latestWeddingPrep = await prisma.weddingPrep.findFirst({
          where: {
            userId: user.userId,
            isDeleted: false,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            updatedAt: true,
          },
        })

        const latestUpdatedAt = latestWeddingPrep?.updatedAt || userDataForETag.updatedAt

        // ETag 생성
        const etag = generateETag({
          latestUpdatedAt: latestUpdatedAt.toISOString(),
        })

        if (compareETag(ifNoneMatch, etag)) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              'ETag': etag,
              'Cache-Control': 'private, no-cache',
            },
          })
        }
      }
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        budget: true,
        ownMoney: true,
        loanAmount: true,
        loanRate: true,
        loanPeriod: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 결혼 준비에서 사용한 총 금액 계산
    const weddingPrepTotal = await prisma.weddingPrep.aggregate({
      where: {
        userId: user.userId,
        isDeleted: false,
      },
      _sum: {
        amount: true,
      },
    })

    const weddingPrepAmount = weddingPrepTotal._sum.amount || 0
    
    // 내 보유금 = 현재 예산 - 결혼 준비에서 사용한 금액
    const calculatedOwnMoney = userData.budget - weddingPrepAmount

    // 결혼 준비에서 최신 updatedAt 조회
    const latestWeddingPrep = await prisma.weddingPrep.findFirst({
      where: {
        userId: user.userId,
        isDeleted: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    })

    const latestUpdatedAt = latestWeddingPrep?.updatedAt || userData.updatedAt

    // ETag 생성
    const etag = generateETag({
      latestUpdatedAt: latestUpdatedAt.toISOString(),
    })

    const response = NextResponse.json({
      ...userData,
      ownMoney: calculatedOwnMoney,
      weddingPrepAmount, // 결혼 준비 사용 금액도 함께 반환
    })

    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache')

    return response
  } catch (error) {
    logger.error('User info get error:', error)
    return NextResponse.json(
      { error: '사용자 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
