import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/utils/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 샘플 데이터 생성 시작...')

  // 샘플 사용자 생성
  const hashedPassword = await hashPassword('password123')

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: '테스트 사용자',
      isDeleted: false,
      lastLoginAt: new Date(),
    },
  })

  console.log('✅ 샘플 사용자 생성 완료:', user)
  console.log('📧 이메일: test@example.com')
  console.log('🔑 비밀번호: password123')
}

main()
  .catch((e) => {
    console.error('❌ 샘플 데이터 생성 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

