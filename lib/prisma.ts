import { PrismaClient } from '@prisma/client'
import logger from './logger'

// Prisma 로그를 winston으로 리다이렉트하는 커스텀 로거
const createPrismaLogger = () => {
  return {
    log: (message: any) => {
      logger.debug('Prisma', { message })
    },
    warn: (message: any) => {
      logger.warn('Prisma', { message })
    },
    error: (message: any) => {
      logger.error('Prisma', { message })
    },
    info: (message: any) => {
      logger.info('Prisma', { message })
    },
    query: (e: { query: string; params: string; duration: number; target?: string }) => {
      // SQL 쿼리를 보기 좋게 포맷팅
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      })
    },
  }
}

// Prisma Client 인스턴스 생성
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientOptions: any = {
  log: process.env.NODE_ENV === 'development' 
    ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ]
    : [{ emit: 'event', level: 'error' }],
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaClientOptions)

// Prisma 이벤트 리스너 설정
const prismaLogger = createPrismaLogger()

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    prismaLogger.query(e)
  })
}

prisma.$on('error' as never, (e: any) => {
  prismaLogger.error(e)
})

prisma.$on('warn' as never, (e: any) => {
  prismaLogger.warn(e)
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
