import { prisma } from '@/lib/prisma'

/**
 * 연결된 상대방 userId 반환 (1:1 연결). 없으면 null.
 */
export async function getConnectedPartnerId(userId: string): Promise<string | null> {
  const conn = await prisma.connection.findFirst({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
  })
  if (!conn) return null
  return conn.userId1 === userId ? conn.userId2 : conn.userId1
}

/**
 * 본인 + 연결된 상대 userId 배열 (공유 조회용). 연결 없으면 [userId]만.
 */
export async function getSharedUserIds(userId: string): Promise<string[]> {
  const partnerId = await getConnectedPartnerId(userId)
  if (!partnerId) return [userId]
  return [userId, partnerId]
}
