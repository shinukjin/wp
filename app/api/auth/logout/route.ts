import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 응답 생성
  const response = NextResponse.json(
    {
      success: true,
      message: '로그아웃되었습니다.',
    },
    { status: 200 }
  )

  // 쿠키 삭제
  response.cookies.set('auth-token', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // 즉시 만료
    path: '/',
  })

  return response
}
