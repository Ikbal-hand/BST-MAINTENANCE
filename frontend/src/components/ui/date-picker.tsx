import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const displayFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function parseDate(value: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function toDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, ariaLabel, placeholder = 'Pilih tanggal', disabled = false }: DatePickerProps) {
  const selectedDate = value ? parseDate(value) : null
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDate(value)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const offset = (firstDay.getDay() + 6) % 7
    const totalDays = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: Math.ceil((offset + totalDays) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1
      return day > 0 && day <= totalDays ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day) : null
    })
  }, [visibleMonth])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function chooseDate(date: Date) {
    onChange(toDateValue(date))
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setOpen(false)
  }

  return (
    <div className={`date-picker${open ? ' is-open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="date-picker-trigger"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays size={16} aria-hidden="true" />
        <span className={selectedDate ? '' : 'is-placeholder'}>{selectedDate ? displayFormatter.format(selectedDate) : placeholder}</span>
      </button>
      {open && (
        <div className="date-picker-popover" role="dialog" aria-label={ariaLabel}>
          <div className="date-picker-header">
            <button type="button" onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="Bulan sebelumnya"><ChevronLeft size={16} /></button>
            <strong>{monthFormatter.format(visibleMonth)}</strong>
            <button type="button" onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="Bulan berikutnya"><ChevronRight size={16} /></button>
          </div>
          <div className="date-picker-grid date-picker-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="date-picker-grid">
            {calendarDays.map((date, index) => date ? (
              <button type="button" key={toDateValue(date)} className={selectedDate && toDateValue(selectedDate) === toDateValue(date) ? 'is-selected' : ''} onClick={() => chooseDate(date)}>{date.getDate()}</button>
            ) : <span key={`empty-${index}`} />)}
          </div>
          <div className="date-picker-footer">
            <button type="button" onClick={() => chooseDate(new Date())}>Hari ini</button>
            {value && <button type="button" onClick={() => { onChange(''); setOpen(false) }} aria-label="Hapus tanggal"><X size={14} /></button>}
          </div>
        </div>
      )}
    </div>
  )
}
