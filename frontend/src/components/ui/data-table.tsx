import type { ReactNode } from 'react'

export interface DataTableColumn<Row> {
  key: string
  header: string
  render: (row: Row) => ReactNode
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  getRowKey: (row: Row) => string
  onRowClick?: (row: Row) => void
  className?: string
  ariaLabel?: string
}

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  className = '',
  ariaLabel,
}: DataTableProps<Row>) {
  return (
    <div className="store-table-wrap">
      <table className={`store-table ${className}`.trim()} aria-label={ariaLabel}>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((column) => <td key={column.key} data-label={column.header}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
