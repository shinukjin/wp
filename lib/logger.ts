import winston from 'winston'
import path from 'path'
import fs from 'fs'

// logs 디렉토리가 없으면 생성
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// 에러 객체를 문자열로 변환하는 헬퍼
const formatError = (error: any): string => {
  if (!error) return ''
  
  if (error instanceof Error) {
    let errorStr = `\n\nError: ${error.name} - ${error.message}`
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 6) // 최대 5줄만
      if (stackLines.length > 0) {
        errorStr += `\n\nStack Trace:\n${stackLines.map(line => `  ${line}`).join('\n')}`
      }
    }
    return errorStr
  }
  
  return `\n\nError: ${String(error)}`
}

// SQL 쿼리를 보기 좋게 포맷팅
const formatQuery = (query: string, params?: string): string => {
  // SQL 키워드를 대문자로 변환하고 들여쓰기 추가
  let formatted = query
    .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET|AND|OR|IN|NOT|EXISTS|AS|ON|SET|VALUES|RETURNING)\b/gi, (match) => match.toUpperCase())
    .replace(/,\s*/g, ',\n    ')
    .replace(/\s+FROM\s+/gi, '\nFROM ')
    .replace(/\s+WHERE\s+/gi, '\nWHERE ')
    .replace(/\s+JOIN\s+/gi, '\nJOIN ')
    .replace(/\s+INNER\s+/gi, '\nINNER ')
    .replace(/\s+LEFT\s+/gi, '\nLEFT ')
    .replace(/\s+RIGHT\s+/gi, '\nRIGHT ')
    .replace(/\s+ORDER BY\s+/gi, '\nORDER BY ')
    .replace(/\s+GROUP BY\s+/gi, '\nGROUP BY ')
    .replace(/\s+HAVING\s+/gi, '\nHAVING ')
    .replace(/\s+LIMIT\s+/gi, '\nLIMIT ')
    .replace(/\s+OFFSET\s+/gi, '\nOFFSET ')
    .replace(/\s+AND\s+/gi, '\n  AND ')
    .replace(/\s+OR\s+/gi, '\n  OR ')
    .replace(/\s+SET\s+/gi, '\nSET ')
    .replace(/\s+VALUES\s+/gi, '\nVALUES ')
    .replace(/\s+RETURNING\s+/gi, '\nRETURNING ')
  
  // 파라미터가 있으면 추가
  if (params) {
    try {
      const parsedParams = JSON.parse(params)
      if (Array.isArray(parsedParams) && parsedParams.length > 0) {
        formatted += `\n\nParameters: ${JSON.stringify(parsedParams, null, 2)
          .split('\n')
          .map((line, idx) => idx === 0 ? line : `  ${line}`)
          .join('\n')}`
      }
    } catch {
      // JSON 파싱 실패 시 원본 표시
      formatted += `\n\nParameters: ${params}`
    }
  }
  
  return formatted
}

// 커스텀 포맷: 메타데이터를 보기 좋게 표시
const customFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}] ${message}`
  
  // 메타데이터가 있으면 포맷팅
  const metaKeys = Object.keys(meta).filter(key => key !== 'service' && key !== 'timestamp')
  
  if (metaKeys.length > 0) {
    // Prisma 쿼리 처리
    if (meta.query) {
      const formattedQuery = formatQuery(meta.query as string, meta.params as string)
      log += `\n\nSQL Query:\n${formattedQuery
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n')}`
      
      if (meta.duration !== undefined && meta.duration !== null) {
        const duration = (meta.duration as number) > 1000 
          ? `${((meta.duration as number) / 1000).toFixed(2)}s` 
          : `${(meta.duration as number)}ms`
        log += `\n\nExecution Time: ${duration}`
      }
      
      if (meta.target) {
        log += `\nTarget: ${meta.target}`
      }
      
      delete meta.query
      delete meta.params
      delete meta.duration
      delete meta.target
    }
    
    // 에러 객체 처리 (여러 위치에서 올 수 있음)
    for (const key of metaKeys) {
      const value = meta[key]
      if (value instanceof Error || (typeof value === 'object' && (value as any)?.stack)) {
        log += formatError(value)
        delete meta[key]
      }
    }
    
    // 나머지 메타데이터
    const remainingMeta = Object.keys(meta).filter(key => key !== 'service' && key !== 'timestamp')
    if (remainingMeta.length > 0) {
      const metaStr = JSON.stringify(
        Object.fromEntries(remainingMeta.map(key => [key, meta[key]])),
        null,
        2
      )
        .split('\n')
        .map((line, idx) => idx === 0 ? `  ${line}` : `  ${line}`)
        .join('\n')
      log += `\n${metaStr}`
    }
  }
  
  return log
})

// Winston 로거 설정
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'wedding-app' },
  transports: [
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 모든 로그 파일
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// 개발 환경에서는 콘솔에도 출력 (보기 좋은 포맷)
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        customFormat
      ),
    })
  )
}

export default logger
