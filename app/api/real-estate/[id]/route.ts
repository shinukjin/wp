import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { rename, unlink, rmdir, mkdir } from 'fs/promises'
import { existsSync} from 'fs'
import path from 'path'

// GET: 단일 항목 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const item = await prisma.realEstate.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!item) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Real estate get error:', error)
    return NextResponse.json(
      { error: '항목을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 항목 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { category, region, rooms, bathrooms, price, preference, images, url, note } = body

    // 기존 항목 확인
    const existingItem = await prisma.realEstate.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미지 검증 (최대 5개)
    let imageArray = existingItem.images || []
    const previousImages = existingItem.images || []
    
    if (images !== undefined) {
      imageArray = Array.isArray(images) ? images.filter((img: string) => img && img.trim()).slice(0, 5) : []
    }

    const userId = user.userId

    // 삭제된 이미지 파일 제거
    const deletedImages = previousImages.filter((prevImg: string) => !imageArray.includes(prevImg))
    for (const deletedImageUrl of deletedImages) {
      if (deletedImageUrl.includes(`/uploads/images/${userId}/`)) {
        try {
          const fileName = deletedImageUrl.split('/').pop()
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', deletedImageUrl.replace(/^\//, ''))
            if (existsSync(filePath)) {
              await unlink(filePath)
              logger.info(`Deleted image file: ${filePath}`)
            }
          }
        } catch (error) {
          logger.error(`Failed to delete image file ${deletedImageUrl}:`, error)
        }
      }
    }

    // temp 폴더의 이미지를 realEstateId 폴더로 이동
    if (imageArray.length > 0) {
      const movedUrls: string[] = []

      for (const imageUrl of imageArray) {
        if (imageUrl.includes(`/uploads/images/${userId}/temp/`)) {
          const fileName = imageUrl.split('/').pop()
          if (fileName) {
            const tempPath = path.join(process.cwd(), 'public', 'uploads', 'images', userId, 'temp', fileName)
            const targetDir = path.join(process.cwd(), 'public', 'uploads', 'images', userId, params.id)
            
            if (!existsSync(targetDir)) {
              await mkdir(targetDir, { recursive: true })
            }

            const targetPath = path.join(targetDir, fileName)

            if (existsSync(tempPath)) {
              try {
                await rename(tempPath, targetPath)
                const newUrl = `/uploads/images/${userId}/${params.id}/${fileName}`
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

      imageArray = movedUrls
    }

    const item = await prisma.realEstate.update({
      where: { id: params.id },
      data: {
        category: category !== undefined ? category : existingItem.category,
        region: region !== undefined ? region : existingItem.region,
        rooms: rooms !== undefined ? rooms : existingItem.rooms,
        bathrooms: bathrooms !== undefined ? bathrooms : existingItem.bathrooms,
        price: price !== undefined ? price : existingItem.price,
        preference: preference !== undefined ? preference : existingItem.preference,
        images: imageArray,
        url: url !== undefined ? url : existingItem.url,
        note: note !== undefined ? note : existingItem.note,
      },
    })

    logger.info(`Real estate item updated: ${item.id}`)

    return NextResponse.json(item)
  } catch (error) {
    logger.error('Real estate update error:', error)
    return NextResponse.json(
      { error: '항목을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 항목 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const existingItem = await prisma.realEstate.findFirst({
      where: {
        id: params.id,
        userId: user.userId,
        isDeleted: false,
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 항목의 이미지 파일 삭제
    const userId = user.userId
    const images = existingItem.images || []
    
    for (const imageUrl of images) {
      if (imageUrl.includes(`/uploads/images/${userId}/`)) {
        try {
          const fileName = imageUrl.split('/').pop()
          if (fileName) {
            const filePath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''))
            if (existsSync(filePath)) {
              await unlink(filePath)
              logger.info(`Deleted image file: ${filePath}`)
            }
          }
        } catch (error) {
          logger.error(`Failed to delete image file ${imageUrl}:`, error)
        }
      }
    }

    // 이미지 폴더 삭제 시도 (폴더가 비어있으면 삭제)
    try {
      const imageDir = path.join(process.cwd(), 'public', 'uploads', 'images', userId, params.id)
      if (existsSync(imageDir)) {
        // 폴더 내 파일 목록 확인 후 빈 폴더이면 삭제
        const fs = await import('fs/promises')
        const files = await fs.readdir(imageDir)
        if (files.length === 0) {
          await rmdir(imageDir)
          logger.info(`Deleted empty image directory: ${imageDir}`)
        }
      }
    } catch (error) {
      logger.error(`Failed to delete image directory:`, error)
      // 폴더 삭제 실패는 무시 (파일이 남아있을 수 있음)
    }

    await prisma.realEstate.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    logger.info(`Real estate item deleted: ${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Real estate delete error:', error)
    return NextResponse.json(
      { error: '항목을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
