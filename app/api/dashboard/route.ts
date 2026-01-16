import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 대시보드 데이터 조회
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

        // 부동산에서 최신 updatedAt 조회
        const latestRealEstate = await prisma.realEstate.findFirst({
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

        // 가장 최신 updatedAt 찾기
        const dates = [
          userDataForETag.updatedAt,
          latestWeddingPrep?.updatedAt,
          latestRealEstate?.updatedAt,
        ].filter(Boolean) as Date[]

        const latestUpdatedAt = dates.length > 0
          ? dates.reduce((latest, date) => (date > latest ? date : latest))
          : userDataForETag.updatedAt

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

    // 사용자 정보 조회
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        budget: true,
        ownMoney: true,
        loanAmount: true,
        loanRate: true,
        loanPeriod: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 결혼 준비 총 금액 계산
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

    // 결혼 준비 상태별 통계
    const statusStats = await prisma.weddingPrep.groupBy({
      by: ['status'],
      where: {
        userId: user.userId,
        isDeleted: false,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // 결혼 준비 카테고리별 통계
    const categoryStats = await prisma.weddingPrep.groupBy({
      by: ['category'],
      where: {
        userId: user.userId,
        isDeleted: false,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    // 부동산 통계
    const realEstateCount = await prisma.realEstate.count({
      where: {
        userId: user.userId,
        isDeleted: false,
      },
    })

    // 내 보유금 = 현재 예산 - 결혼 준비에서 사용한 금액
    const calculatedOwnMoney = userData.budget - weddingPrepAmount

    // 대출 정보 계산 (월 상환액)
    let monthlyPayment = 0
    if (userData.loanAmount > 0 && userData.loanRate > 0 && userData.loanPeriod > 0) {
      const monthlyRate = userData.loanRate / 100 / 12
      const numPayments = userData.loanPeriod
      if (monthlyRate > 0) {
        monthlyPayment = userData.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      } else {
        monthlyPayment = userData.loanAmount / numPayments
      }
    }

    // 최신 updatedAt 조회 (실제 데이터 조회 후)
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

    const latestRealEstate = await prisma.realEstate.findFirst({
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

    // 사용자 정보의 updatedAt도 조회
    const userDataWithUpdatedAt = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        updatedAt: true,
      },
    })

    // 가장 최신 updatedAt 찾기
    const dates = [
      userDataWithUpdatedAt?.updatedAt,
      latestWeddingPrep?.updatedAt,
      latestRealEstate?.updatedAt,
    ].filter(Boolean) as Date[]

    const latestUpdatedAt = dates.length > 0
      ? dates.reduce((latest, date) => (date > latest ? date : latest))
      : new Date()

    // ETag 생성
    const etag = generateETag({
      latestUpdatedAt: latestUpdatedAt.toISOString(),
    })

    const response = NextResponse.json({
      budget: userData.budget,
      ownMoney: calculatedOwnMoney,
      weddingPrepAmount,
      loanAmount: userData.loanAmount,
      loanRate: userData.loanRate,
      loanPeriod: userData.loanPeriod,
      monthlyPayment: Math.round(monthlyPayment),
      statusStats: statusStats.map(stat => ({
        status: stat.status,
        amount: stat._sum.amount || 0,
        count: stat._count.id,
      })),
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        amount: stat._sum.amount || 0,
        count: stat._count.id,
      })),
      realEstateCount,
    })

    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache')

    return response
  } catch (error) {
    logger.error('Dashboard get error:', error)
    return NextResponse.json(
      { error: '대시보드 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
