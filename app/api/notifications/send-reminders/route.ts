import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromHeader } from '@/lib/utils/auth'
import { getConnectedPartnerId, getSharedUserIds } from '@/lib/utils/connection'
import { sendDiscordWebhook } from '@/lib/utils/discord'
import logger from '@/lib/logger'

const KST = 'Asia/Seoul'

function getKstNow() {
  const now = new Date()
  const kst = new Date(now.toLocaleString('en-US', { timeZone: KST }))
  return {
    year: kst.getFullYear(),
    month: kst.getMonth() + 1,
    day: kst.getDate(),
    hour: kst.getHours(),
  }
}

function getKstDateStr(d: Date): string {
  const kst = new Date(d.toLocaleString('en-US', { timeZone: KST }))
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(kst.getDate()).padStart(2, '0')}`
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
 * GET: cron용 - 전날/당일 오전 9시(KST)에 알림 전송
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
    if (kst.hour < 9 || kst.hour >= 10) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: '오전 9시(9:00~9:59)에만 전송됩니다.',
      })
    }

    const todayStr = `${kst.year}-${String(kst.month).padStart(2, '0')}-${String(kst.day).padStart(2, '0')}`

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
        reminderSentDayBefore: true,
        reminderSentDayOf: true,
      },
    })

    const sentIdsDayBefore: string[] = []
    const sentIdsDayOf: string[] = []

    for (const s of schedules) {
      if (!s.dueDate) continue
      const dueStr = getKstDateStr(s.dueDate)
      const dueDate = new Date(s.dueDate)
      const dueDayBefore = new Date(dueDate)
      dueDayBefore.setDate(dueDayBefore.getDate() - 1)
      const dayBeforeStr = getKstDateStr(dueDayBefore)

      if (todayStr === dayBeforeStr && !s.reminderSentDayBefore) {
        const dueFormatted = s.dueDate.toLocaleString('ko-KR', {
          timeZone: KST,
          dateStyle: 'short',
          timeStyle: 'short',
        })
        const msg = `@everyone 🔔 일정 알림 (내일)\n**${s.title}**\n예정일: ${dueFormatted}${s.note ? `\n${s.note}` : ''}`
        await sendForSchedule(s, msg)
        sentIdsDayBefore.push(s.id)
      }

      if (todayStr === dueStr && !s.reminderSentDayOf) {
        const dueFormatted = s.dueDate.toLocaleString('ko-KR', {
          timeZone: KST,
          dateStyle: 'short',
          timeStyle: 'short',
        })
        const msg = `@everyone 🔔 일정 알림 (오늘)\n**${s.title}**\n예정일: ${dueFormatted}${s.note ? `\n${s.note}` : ''}`
        await sendForSchedule(s, msg)
        sentIdsDayOf.push(s.id)
      }
    }

    const now = new Date()
    if (sentIdsDayBefore.length > 0) {
      await prisma.travelSchedule.updateMany({
        where: { id: { in: sentIdsDayBefore } },
        data: { reminderSentDayBefore: now },
      })
    }
    if (sentIdsDayOf.length > 0) {
      await prisma.travelSchedule.updateMany({
        where: { id: { in: sentIdsDayOf } },
        data: { reminderSentDayOf: now },
      })
    }

    const total = sentIdsDayBefore.length + sentIdsDayOf.length
    logger.info(`Reminders sent (cron): dayBefore=${sentIdsDayBefore.length}, dayOf=${sentIdsDayOf.length}`)
    return NextResponse.json({
      success: true,
      sent: total,
      message: `전날 ${sentIdsDayBefore.length}건, 당일 ${sentIdsDayOf.length}건 알림 전송 완료`,
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
      const dueStr = getKstDateStr(s.dueDate)
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
