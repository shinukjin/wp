import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getSharedUserIds } from '@/lib/utils/connection'
import logger from '@/lib/logger'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 결혼 준비 항목 목록 조회 (필터링 포함, 연결 시 상대 자료 공유)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userIds = await getSharedUserIds(user.userId)

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    // 필터 조건 구성
    const where: any = {
      userId: { in: userIds },
      isDeleted: false,
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) where.amount.gte = parseInt(minAmount)
      if (maxAmount) where.amount.lte = parseInt(maxAmount)
    }

    // If-None-Match 헤더 먼저 확인 (조건부 요청)
    const ifNoneMatch = request.headers.get('If-None-Match')
    
    // 헤더가 있으면, 최신 updatedAt만 조회하여 ETag 생성 (가벼운 쿼리)
    if (ifNoneMatch) {
      const latestUpdate = await prisma.weddingPrep.findFirst({
        where,
        select: {
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      // 총 금액을 빠르게 계산하기 위해 집계 사용
      const totalAmountResult = await prisma.weddingPrep.aggregate({
        where,
        _sum: {
          amount: true,
        },
      })

      const count = await prisma.weddingPrep.count({ where })

      // 필터 조건과 최신 updatedAt, 총 금액, count 기반으로 ETag 생성
      const etag = generateETag({
        filter: { category, status, minAmount, maxAmount },
        latestUpdatedAt: latestUpdate?.updatedAt?.toISOString() || null,
        totalAmount: totalAmountResult._sum.amount || 0,
        count,
      })

      if (compareETag(ifNoneMatch, etag)) {
        // 데이터 변경 없음 - 304 Not Modified 반환 (전체 데이터 조회 없이)
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': 'private, no-cache, must-revalidate',
            'Vary': 'Authorization',
          },
        })
      }
    }

    // 데이터 변경됨 또는 첫 요청 - 전체 데이터 조회 (수정자 포함)
    const items = await prisma.weddingPrep.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        updatedBy: { select: { email: true, name: true } },
      },
    })

    // 총 금액 계산
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    // If-None-Match가 있었지만 변경된 경우, 동일한 방식으로 ETag 재생성
    // (필터 기반 ETag와 일치하도록) - 최신 updatedAt 찾기
    const latestUpdate = items.length > 0
      ? items.reduce((latest, item) => {
          if (!item.updatedAt) return latest
          if (!latest || item.updatedAt > latest) return item.updatedAt
          return latest
        }, null as Date | null)
      : null

    const etag = generateETag({
      filter: { category, status, minAmount, maxAmount },
      latestUpdatedAt: latestUpdate?.toISOString() || null,
      totalAmount,
      count: items.length,
    })

    // 데이터 변경됨 또는 첫 요청 - 200 OK와 함께 데이터 반환
    const response = NextResponse.json({
      items,
      totalAmount,
      count: items.length,
    })

    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate')
    response.headers.set('Vary', 'Authorization')

    return response
  } catch (error) {
    logger.error('Wedding prep list error:', error)
    return NextResponse.json(
      { error: '목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 결혼 준비 항목 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { category, subCategory, content, amount, status, priority, dueDate, note } = body

    // 필수 필드 검증
    if (!category || !content) {
      return NextResponse.json(
        { error: '구분과 내용은 필수입니다.' },
        { status: 400 }
      )
    }

    const item = await prisma.weddingPrep.create({
      data: {
        userId: user.userId,
        updatedById: user.userId,
        category,
        subCategory: subCategory || null,
        content,
        amount: amount || 0,
        status: status || '진행중',
        priority: priority || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        note: note || null,
      },
      include: {
        updatedBy: { select: { email: true, name: true } },
      },
    })

    logger.info(`Wedding prep item created: ${item.id}`)

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    logger.error('Wedding prep create error:', error)
    return NextResponse.json(
      { error: '항목을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
