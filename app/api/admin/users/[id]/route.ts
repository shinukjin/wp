import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import logger from '@/lib/logger'

/** PATCH: 관리자가 회원 정보 수정 (비밀번호 제외) */
export async function PATCH(
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
      return NextResponse.json(
        { error: '관리자만 회원 정보를 수정할 수 있습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const target = await prisma.user.findUnique({
      where: { id },
    })

    if (!target || target.isDeleted) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}

    if (typeof body.email === 'string') {
      const email = body.email.trim()
      if (!email) {
        return NextResponse.json(
          { error: '이메일을 입력해주세요.' },
          { status: 400 }
        )
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: '올바른 이메일 형식이 아닙니다.' },
          { status: 400 }
        )
      }
      const existing = await prisma.user.findUnique({
        where: { email },
      })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: '이미 사용 중인 이메일입니다.' },
          { status: 400 }
        )
      }
      data.email = email
    }

    if (body.name !== undefined) {
      data.name = body.name === null || body.name === '' ? null : String(body.name).trim()
    }

    if (typeof body.approved === 'boolean') {
      data.approved = body.approved
    }

    if (typeof body.isAdmin === 'boolean') {
      data.isAdmin = body.isAdmin
    }

    if (typeof body.budget === 'number' && Number.isInteger(body.budget) && body.budget >= 0) {
      data.budget = body.budget
    }
    if (typeof body.ownMoney === 'number' && Number.isInteger(body.ownMoney) && body.ownMoney >= 0) {
      data.ownMoney = body.ownMoney
    }
    if (typeof body.loanAmount === 'number' && Number.isInteger(body.loanAmount) && body.loanAmount >= 0) {
      data.loanAmount = body.loanAmount
    }
    if (typeof body.loanRate === 'number' && body.loanRate >= 0) {
      data.loanRate = body.loanRate
    }
    if (typeof body.loanPeriod === 'number' && Number.isInteger(body.loanPeriod) && body.loanPeriod >= 0) {
      data.loanPeriod = body.loanPeriod
    }

    if (body.discordWebhookUrl !== undefined) {
      data.discordWebhookUrl =
        body.discordWebhookUrl === null || body.discordWebhookUrl === ''
          ? null
          : String(body.discordWebhookUrl).trim()
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '수정할 항목이 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id },
      data: data as any,
    })

    logger.info(`Admin updated user: ${target.email} (${id})`, data)

    return NextResponse.json({ success: true, message: '수정되었습니다.' })
  } catch (error) {
    logger.error('Admin user update error:', error)
    return NextResponse.json(
      { error: '회원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
