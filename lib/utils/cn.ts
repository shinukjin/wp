import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * tailwind-merge와 clsx를 함께 사용하여 중복 클래스를 처리
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
