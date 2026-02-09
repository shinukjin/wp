import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getConnectedPartnerId, getSharedUserIds } from '@/lib/utils/connection'
import { sendDiscordWebhook } from '@/lib/utils/discord'
import logger from '@/lib/logger'

const KST = 'Asia/Seoul'

/** KST 기준 현재 시각의 연/월/일/시 반환 (서버 타임존 무관) */
function getKstNow() {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0'
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    hour: parseInt(get('hour'), 10),
  }
}

/** Date를 KST 기준 YYYY-MM-DD로 (오늘/내일 비교용) */
function getDateStr(d: Date): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0'
  return `${get('year')}-${get('month')}-${get('day')}`
}

async function sendForSchedule(
  schedule: { id: string; userId: string; title: string; dueDate: Date | null; note: string | null },
  message: string
): Promise<boolean> {
  const userIds: string[] = [schedule.userId]
  const partnerId = await getConnectedPartnerId(schedule.userId)
  if (partnerId) userIds.push(partnerId)

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, isDeleted: false },
    select: { discordWebhookUrl: true },
  })

  let sent = false
  for (const u of users) {
    if (u.discordWebhookUrl) {
      await sendDiscordWebhook(u.discordWebhookUrl, message)
      sent = true
    }
  }
  return sent
}

/**
 * GET: cron용 - 오늘/내일(KST) 예정일 일정 조회 후 전부 알림 전송
 * POST: 사용자 직접 보내기 - 오늘/내일 일정 알림 즉시 전송
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      const provided = authHeader?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
      if (provided !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const kst = getKstNow()
    const todayStr = `${kst.year}-${String(kst.month).padStart(2, '0')}-${String(kst.day).padStart(2, '0')}`
    const tomorrow = new Date(kst.year, kst.month - 1, kst.day + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    const schedules = await prisma.travelSchedule.findMany({
      where: {
        isDeleted: false,
        remindEnabled: true,
        dueDate: { not: null },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        dueDate: true,
        note: true,
      },
    })

    let sentToday = 0
    let sentTomorrow = 0

    for (const s of schedules) {
      if (!s.dueDate) continue
      const dueStr = getDateStr(s.dueDate)
      if (dueStr !== todayStr && dueStr !== tomorrowStr) continue

      const dueFormatted = s.dueDate.toLocaleString('ko-KR', {
        timeZone: KST,
        dateStyle: 'short',
        timeStyle: 'short',
      })
      const label = dueStr === todayStr ? '오늘' : '내일'
      const msg = `@everyone 🔔 일정 알림 (${label})\n**${s.title}**\n예정일: ${dueFormatted}${s.note ? `\n${s.note}` : ''}`
      const ok = await sendForSchedule(s, msg)
      if (ok) {
        if (dueStr === todayStr) sentToday++
        else sentTomorrow++
      }
    }

    const total = sentToday + sentTomorrow
    logger.info(`Reminders sent (cron): today=${sentToday}, tomorrow=${sentTomorrow}`)
    return NextResponse.json({
      success: true,
      sent: total,
      message: `오늘 ${sentToday}건, 내일 ${sentTomorrow}건 알림 전송 완료`,
    })
  } catch (error) {
    logger.error('Send reminders error:', error)
    return NextResponse.json(
      { error: '알림 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST: 사용자 직접 보내기 - 오늘/내일 일정 알림 즉시 전송
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = getAuthFromHeader(authHeader)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userIds = await getSharedUserIds(user.userId)
    const kst = getKstNow()
    const todayStr = `${kst.year}-${String(kst.month).padStart(2, '0')}-${String(kst.day).padStart(2, '0')}`
    const tomorrow = new Date(kst.year, kst.month - 1, kst.day + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    const schedules = await prisma.travelSchedule.findMany({
      where: {
        userId: { in: userIds },
        isDeleted: false,
        remindEnabled: true,
        dueDate: { not: null },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        dueDate: true,
        note: true,
      },
    })

    let sent = 0
    for (const s of schedules) {
      if (!s.dueDate) continue
      const dueStr = getDateStr(s.dueDate)
      if (dueStr !== todayStr && dueStr !== tomorrowStr) continue

      const label = dueStr === todayStr ? '오늘' : '내일'
      const dueFormatted = s.dueDate.toLocaleString('ko-KR', {
        timeZone: KST,
        dateStyle: 'short',
        timeStyle: 'short',
      })
      const msg = `@everyone 🔔 일정 알림 (${label})\n**${s.title}**\n예정일: ${dueFormatted}${s.note ? `\n${s.note}` : ''}`
      const ok = await sendForSchedule(s, msg)
      if (ok) sent++
    }

    logger.info(`Reminders sent (manual): ${sent} schedules for user ${user.userId}`)
    return NextResponse.json({
      success: true,
      sent,
      message: sent > 0 ? `${sent}건 알림 전송 완료` : '전송할 알림이 없습니다. (오늘/내일 일정만)',
    })
  } catch (error) {
    logger.error('Send reminders manual error:', error)
    return NextResponse.json(
      { error: '알림 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
