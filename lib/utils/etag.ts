import { createHash } from 'crypto'

/**
 * 데이터로부터 ETag 생성
 * @param data - ETag를 생성할 데이터 (객체, 배열 등)
 * @returns ETag 문자열 (예: "abc123")
 */
export function generateETag(data: any): string {
  const jsonString = JSON.stringify(data)
  const hash = createHash('md5').update(jsonString).digest('hex')
  // ETag는 보통 따옴표로 감싸지만, MD5 해시를 그대로 사용해도 됩니다
  return `"${hash}"`
}

/**
 * If-None-Match 헤더와 ETag 비교
 * @param ifNoneMatch - If-None-Match 헤더 값
 * @param etag - 현재 리소스의 ETag
 * @returns ETag가 일치하면 true (304 응답 가능)
 */
export function compareETag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) {
    return false
  }
  
  // If-None-Match는 쉼표로 구분된 여러 ETag를 포함할 수 있음
  const etags = ifNoneMatch.split(',').map(e => e.trim().replace(/"/g, ''))
  const currentETag = etag.replace(/"/g, '')
  
  return etags.includes(currentETag)
}
