import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

// GET: 엑셀 다운로드용 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = {
      userId: user.userId,
      isDeleted: false,
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    const items = await prisma.weddingPrep.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // 엑셀 포맷으로 데이터 변환
    const exportData = items.map((item, index) => ({
      번호: index + 1,
      구분: item.category,
      상세구분: item.subCategory || '',
      내용: item.content,
      금액: item.amount,
      상태: item.status,
      우선순위: item.priority === 2 ? '높음' : item.priority === 1 ? '보통' : '낮음',
      예정일: item.dueDate ? new Date(item.dueDate).toLocaleDateString('ko-KR') : '',
      완료일: item.completedAt ? new Date(item.completedAt).toLocaleDateString('ko-KR') : '',
      비고: item.note || '',
    }))

    return NextResponse.json({ data: exportData })
  } catch (error) {
    logger.error('Wedding prep export error:', error)
    return NextResponse.json(
      { error: '데이터를 내보내는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
