'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

const base = 'inline-flex items-center font-medium rounded transition-colors touch-manipulation'

interface TableButtonProps {
  onClick?: () => void
  type?: 'button' | 'submit'
  children?: ReactNode
  className?: string
  disabled?: boolean
}

/** 저장 (녹색) */
export function ButtonSave({ onClick, type = 'button', children = '저장', className, disabled }: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, 'px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 text-xs', className)}
    >
      {children}
    </button>
  )
}

/** 취소 (빨간 텍스트) */
export function ButtonCancel({ onClick, type = 'button', children = '취소', className, disabled }: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, 'px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs', className)}
    >
      {children}
    </button>
  )
}

/** 수정 (파란색) */
export function ButtonEdit({ onClick, type = 'button', children = '수정', className, disabled }: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, 'px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs', className)}
    >
      {children}
    </button>
  )
}

/** 삭제 (빨간색) */
export function ButtonDelete({ onClick, type = 'button', children = '삭제', className, disabled }: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, 'px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs', className)}
    >
      {children}
    </button>
  )
}

/** 항목 추가 (파란 배경 + 아이콘) */
export function ButtonAddItem({
  onClick,
  type = 'button',
  children = '항목 추가',
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'gap-1 px-2 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
        className
      )}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {children}
    </button>
  )
}

/** 엑셀 다운로드 (녹색 배경) */
export function ButtonExportExcel({
  onClick,
  type = 'button',
  children = '엑셀',
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 shadow-sm',
        className
      )}
    >
      {children}
    </button>
  )
}

/** 일괄 저장 (녹색 배경) */
export function ButtonBatchSave({
  onClick,
  type = 'button',
  children,
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-2 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 border border-green-600',
        className
      )}
    >
      {children}
    </button>
  )
}

/** 보조(회색 아웃라인) - 모두 취소 등 */
export function ButtonSecondary({
  onClick,
  type = 'button',
  children,
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-2 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-100',
        className
      )}
    >
      {children}
    </button>
  )
}

/** 예산/설정 수정 (파란 텍스트) */
export function ButtonEditBudget({ onClick, type = 'button', children = '수정', className, disabled }: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg shadow-sm',
        className
      )}
    >
      {children}
    </button>
  )
}

/** 확인/저장 (파란 배경 - 예산 저장 등) */
export function ButtonPrimary({
  onClick,
  type = 'button',
  children = '저장',
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700',
        className
      )}
    >
      {children}
    </button>
  )
}

/** 회색 취소 (예산 편집 취소 등) */
export function ButtonGrayCancel({
  onClick,
  type = 'button',
  children = '취소',
  className,
  disabled,
}: TableButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        'px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 shadow-sm',
        className
      )}
    >
      {children}
    </button>
  )
}
