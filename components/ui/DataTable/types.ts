export interface DataTableColumn {
  key: string
  label: string
  /** 픽셀 너비 (리사이즈 시 변경됨) */
  width?: number
  /** 최소 너비 (픽셀) */
  minWidth?: number
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps {
  /** 컬럼 정의 (width 있으면 초기값, 리사이즈 시 변경 가능) */
  columns: DataTableColumn[]
  /** 컬럼 너비 변경 시 (storageKey와 함께 사용해 persist 가능) */
  onColumnWidthsChange?: (widths: number[]) => void
  /** 초기/외부에서 지정한 컬럼 너비 배열 (columns.length와 동일) */
  columnWidths?: number[]
  /** localStorage 키. 있으면 로드/저장으로 컬럼 너비 유지 */
  storageKey?: string
  /** 테이블 최소 너비 (fillContainer false일 때만 사용) */
  minTableWidth?: number
  /** true면 테이블이 부모(섹션) 너비 100%를 꽉 채움. false면 컬럼 픽셀 너비 보장 + 가로 스크롤 (기본 true) */
  fillContainer?: boolean
  /** tbody 내용 */
  children: React.ReactNode
  /** tfoot 내용 (선택) */
  footer?: React.ReactNode
  className?: string
  tableClassName?: string
}
