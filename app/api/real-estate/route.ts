import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { rename, mkdir } from 'fs/promises'
import { existsSync} from 'fs'
import path from 'path'
import { generateETag, compareETag } from '@/lib/utils/etag'

// GET: 부동산 항목 목록 조회 (필터링 포함)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const region = searchParams.get('region')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // 필터 조건 구성
    const where: any = {
      userId: user.userId,
      isDeleted: false,
    }

    if (category) {
      where.category = category
    }

    if (region) {
      where.region = {
        contains: region,
      }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseInt(minPrice)
      if (maxPrice) where.price.lte = parseInt(maxPrice)
    }

    // If-None-Match 헤더 먼저 확인 (조건부 요청)
    const ifNoneMatch = request.headers.get('If-None-Match')
    
    // 헤더가 있으면, 최신 updatedAt만 조회하여 ETag 생성 (가벼운 쿼리)
    if (ifNoneMatch) {
      const latestUpdate = await prisma.realEstate.findFirst({
        where,
        select: {
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      const count = await prisma.realEstate.count({ where })

      // 필터 조건과 최신 updatedAt, count 기반으로 ETag 생성
      const etag = generateETag({
        filter: { category, region, minPrice, maxPrice },
        latestUpdatedAt: latestUpdate?.updatedAt?.toISOString() || null,
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

    // 데이터 변경됨 또는 첫 요청 - 전체 데이터 조회
    const items = await prisma.realEstate.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
    })

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
      filter: { category, region, minPrice, maxPrice },
      latestUpdatedAt: latestUpdate?.toISOString() || null,
      count: items.length,
    })

    // 데이터 변경됨 또는 첫 요청 - 200 OK와 함께 데이터 반환
    const response = NextResponse.json({
      items,
      count: items.length,
    })

    // ETag 및 캐싱 헤더 설정
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, no-cache, must-revalidate')
    response.headers.set('Vary', 'Authorization')

    return response
  } catch (error) {
    logger.error('Real estate list error:', error)
    return NextResponse.json(
      { error: '목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 부동산 항목 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { category, region, rooms, bathrooms, price, preference, images, url, note } = body

    // 필수 필드 검증
    if (!category || !region) {
      return NextResponse.json(
        { error: '구분과 지역은 필수입니다.' },
        { status: 400 }
      )
    }

    // 이미지 검증 (최대 5개)
    let imageArray = Array.isArray(images) ? images.filter((img: string) => img && img.trim()).slice(0, 5) : []

    // 항목 생성
    const item = await prisma.realEstate.create({
      data: {
        userId: user.userId,
        category,
        region,
        rooms: rooms || 0,
        bathrooms: bathrooms || 0,
        price: price || 0,
        preference: preference !== undefined ? preference : 1,
        images: imageArray,
        url: url || null,
        note: note || null,
      },
    })

    // temp 폴더의 이미지를 realEstateId 폴더로 이동
    if (imageArray.length > 0) {
      const userId = user.userId
      const movedUrls: string[] = []

      for (const imageUrl of imageArray) {
        if (imageUrl.includes(`/uploads/images/${userId}/temp/`)) {
          const fileName = imageUrl.split('/').pop()
          if (fileName) {
            const tempPath = path.join(process.cwd(), 'public', 'uploads', 'images', userId, 'temp', fileName)
            const targetDir = path.join(process.cwd(), 'public', 'uploads', 'images', userId, item.id)
            
            if (!existsSync(targetDir)) {
              await mkdir(targetDir, { recursive: true })
            }

            const targetPath = path.join(targetDir, fileName)

            if (existsSync(tempPath)) {
              try {
                await rename(tempPath, targetPath)
                const newUrl = `/uploads/images/${userId}/${item.id}/${fileName}`
                movedUrls.push(newUrl)
              } catch (error) {
                logger.error(`Failed to move image ${fileName}:`, error)
                movedUrls.push(imageUrl) // 이동 실패 시 원래 URL 유지
              }
            } else {
              movedUrls.push(imageUrl)
            }
          } else {
            movedUrls.push(imageUrl)
          }
        } else {
          movedUrls.push(imageUrl)
        }
      }

      // 이동된 URL로 업데이트
      if (movedUrls.length > 0 && JSON.stringify(movedUrls) !== JSON.stringify(imageArray)) {
        await prisma.realEstate.update({
          where: { id: item.id },
          data: { images: movedUrls },
        })
        imageArray = movedUrls
      }
    }

    logger.info(`Real estate item created: ${item.id}`)

    return NextResponse.json({ ...item, images: imageArray }, { status: 201 })
  } catch (error) {
    logger.error('Real estate create error:', error)
    return NextResponse.json(
      { error: '항목을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
