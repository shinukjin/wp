import { cn } from '@/lib/utils/cn'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export default function Container({
  children,
  className,
  maxWidth = 'xl',
}: ContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  }

  // Header/Footer와 완전히 동일한 구조: container mx-auto px-4
  // maxWidth가 'full'일 때는 max-w-full 추가
  return (
    <div
      className={cn(
        'container mx-auto px-4', // Header/Footer와 동일
        maxWidth === 'full',
        className
      )}
    >
      {children}
    </div>
  )
}
