import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, rename } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const realEstateId = formData.get('realEstateId') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 })
    }

    // 이미지 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 })
    }

    // 디렉토리 구조: public/uploads/images/{userId}/{realEstateId || 'temp'}/
    const userId = user.userId
    const targetDir = realEstateId 
      ? path.join(process.cwd(), 'public', 'uploads', 'images', userId, realEstateId)
      : path.join(process.cwd(), 'public', 'uploads', 'images', userId, 'temp')

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
    }

    // 고유한 파일명 생성
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${randomString}${fileExtension}`

    // 파일 저장
    const filePath = path.join(targetDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // 공개 URL 반환
    const publicUrl = realEstateId
      ? `/uploads/images/${userId}/${realEstateId}/${fileName}`
      : `/uploads/images/${userId}/temp/${fileName}`

    // realEstateId가 있으면 해당 항목의 updatedAt을 업데이트하여 ETag 변경
    if (realEstateId) {
      try {
        await prisma.realEstate.update({
          where: {
            id: realEstateId,
            userId: userId, // 보안: 본인 항목만 업데이트
          },
          data: {
            updatedAt: new Date(),
          },
        })
        logger.info(`Real estate item ${realEstateId} updatedAt updated after image upload`)
      } catch (error) {
        // 항목이 없거나 권한이 없는 경우는 로그만 남기고 계속 진행
        logger.warn(`Failed to update real estate item ${realEstateId}:`, error)
      }
    }

    logger.info(`Image uploaded: ${publicUrl} by user ${userId}`)

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    logger.error('Image upload error:', error)
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 이미지 이동 API (temp -> realEstateId)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrls, realEstateId } = body

    if (!realEstateId || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: '부동산 ID와 이미지 URL 목록이 필요합니다.' }, { status: 400 })
    }

    const userId = user.userId
    const movedUrls: string[] = []

    for (const imageUrl of imageUrls) {
      // temp 폴더의 이미지인지 확인
      if (imageUrl.includes(`/uploads/images/${userId}/temp/`)) {
        const fileName = imageUrl.split('/').pop()
        if (fileName) {
          const tempPath = path.join(process.cwd(), 'public', 'uploads', 'images', userId, 'temp', fileName)
          const targetDir = path.join(process.cwd(), 'public', 'uploads', 'images', userId, realEstateId)
          
          if (!existsSync(targetDir)) {
            await mkdir(targetDir, { recursive: true })
          }

          const targetPath = path.join(targetDir, fileName)

          if (existsSync(tempPath)) {
            await rename(tempPath, targetPath)
            const newUrl = `/uploads/images/${userId}/${realEstateId}/${fileName}`
            movedUrls.push(newUrl)
          } else {
            // 파일이 없으면 원래 URL 유지
            movedUrls.push(imageUrl)
          }
        } else {
          movedUrls.push(imageUrl)
        }
      } else {
        // 이미 다른 위치에 있으면 그대로 유지
        movedUrls.push(imageUrl)
      }
    }

    return NextResponse.json({
      success: true,
      urls: movedUrls,
    })
  } catch (error) {
    logger.error('Image move error:', error)
    return NextResponse.json(
      { error: '이미지 이동 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
