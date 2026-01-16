import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 대출 정보 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        ownMoney: true,
        loanAmount: true,
        loanRate: true,
        loanPeriod: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // ETag 생성 (대출 정보 데이터 기반)
    const etag = generateETag({
      ownMoney: userData.ownMoney,
      loanAmount: userData.loanAmount,
      loanRate: userData.loanRate,
      loanPeriod: userData.loanPeriod,
    })

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
    const response = NextResponse.json({
      ownMoney: userData.ownMoney,
      loanAmount: userData.loanAmount,
      loanRate: userData.loanRate,
      loanPeriod: userData.loanPeriod,
    })
    
    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate')
    response.headers.set('Vary', 'Authorization')

    return response
  } catch (error) {
    logger.error('Loan info get error:', error)
    return NextResponse.json(
      { error: '대출 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 대출 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { ownMoney, loanAmount, loanRate, loanPeriod } = body

    const updateData: any = {}

    if (ownMoney !== undefined) {
      if (typeof ownMoney !== 'number' || ownMoney < 0) {
        return NextResponse.json(
          { error: '올바른 보유금액을 입력해주세요.' },
          { status: 400 }
        )
      }
      updateData.ownMoney = ownMoney
    }

    if (loanAmount !== undefined) {
      if (typeof loanAmount !== 'number' || loanAmount < 0) {
        return NextResponse.json(
          { error: '올바른 대출금액을 입력해주세요.' },
          { status: 400 }
        )
      }
      updateData.loanAmount = loanAmount
    }

    if (loanRate !== undefined) {
      if (typeof loanRate !== 'number' || loanRate < 0 || loanRate > 100) {
        return NextResponse.json(
          { error: '올바른 대출이율을 입력해주세요. (0-100%)' },
          { status: 400 }
        )
      }
      updateData.loanRate = loanRate
    }

    if (loanPeriod !== undefined) {
      if (typeof loanPeriod !== 'number' || loanPeriod < 0) {
        return NextResponse.json(
          { error: '올바른 대출기간을 입력해주세요.' },
          { status: 400 }
        )
      }
      updateData.loanPeriod = loanPeriod
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        ownMoney: true,
        loanAmount: true,
        loanRate: true,
        loanPeriod: true,
      },
    })

    logger.info(`Loan info updated for user: ${user.userId}`)

    return NextResponse.json({
      ownMoney: updatedUser.ownMoney,
      loanAmount: updatedUser.loanAmount,
      loanRate: updatedUser.loanRate,
      loanPeriod: updatedUser.loanPeriod,
    })
  } catch (error) {
    logger.error('Loan info update error:', error)
    return NextResponse.json(
      { error: '대출 정보를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
