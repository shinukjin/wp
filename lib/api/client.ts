import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'

// API 클라이언트 설정 (NEXT_PUBLIC_APP_URL 또는 NEXT_PUBLIC_API_URL 사용)
const createApiClient = (): AxiosInstance => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') // 끝 슬래시 제거
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL ||
    (appUrl ? `${appUrl}/api` : 'http://localhost:3000/api')

  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 요청 인터셉터 (토큰 추가 등)
  client.interceptors.request.use(
    (config) => {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('token') 
        : null

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // 응답 인터셉터 (에러 처리 등)
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // 토큰 만료 등의 경우 로그아웃 처리
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          // 필요시 로그인 페이지로 리다이렉트
          // window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

const apiClient = createApiClient()

export default apiClient
