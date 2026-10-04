import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  createComboBoxSearchIndex,
  getNextComboBoxActiveIndex,
  getVirtualOptionRange,
  searchComboBoxOptions,
} from './combo-box-utils'

const optionHeight = 52
const defaultViewportHeight = 230
const optionOverscan = 4

export interface ComboBoxOption {
  value: string
  label: string
  description?: string
}

interface ComboBoxProps {
  value: string
  options: ComboBoxOption[]
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  ariaLabel: string
  disabled?: boolean
  allowCustomValue?: boolean
}

export function ComboBox({
  value,
  options,
  onChange,
  placeholder = 'Pilih opsi',
  searchPlaceholder = 'Cari...',
  ariaLabel,
  disabled = false,
  allowCustomValue = false,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(defaultViewportHeight)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const optionByValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options])
  const selected = optionByValue.get(value)
  const selectedLabel = selected?.label ?? (allowCustomValue ? value : undefined)
  const searchIndex = useMemo(() => createComboBoxSearchIndex(options), [options])
  const { options: filteredOptions, hasExactMatch } = useMemo(
    () => searchComboBoxOptions(searchIndex, search),
    [search, searchIndex],
  )
  const hasCustomValue = Boolean(allowCustomValue && search.trim() && !hasExactMatch)
  const totalRows = filteredOptions.length + (hasCustomValue ? 1 : 0)
  const visibleRange = getVirtualOptionRange(
    totalRows,
    scrollTop,
    viewportHeight,
    optionHeight,
    optionOverscan,
  )
  const visibleOptions = filteredOptions.slice(
    Math.max(0, visibleRange.start - (hasCustomValue ? 1 : 0)),
    Math.max(0, visibleRange.end - (hasCustomValue ? 1 : 0)),
  )

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    const list = optionsRef.current
    if (!open || !list) return

    const updateViewportHeight = () => setViewportHeight(list.clientHeight || defaultViewportHeight)
    updateViewportHeight()
    const observer = new ResizeObserver(updateViewportHeight)
    observer.observe(list)
    return () => observer.disconnect()
  }, [open, totalRows])

  function selectOption(option: ComboBoxOption) {
    onChange(option.value)
    setSearch('')
    setActiveIndex(null)
    setOpen(false)
  }

  function selectCustomValue() {
    const customValue = search.trim()
    if (!customValue) return
    onChange(customValue)
    setSearch('')
    setActiveIndex(null)
    setOpen(false)
  }

  function updateSearch(value: string) {
    setSearch(value)
    setScrollTop(0)
    setActiveIndex(null)
    if (optionsRef.current) optionsRef.current.scrollTop = 0
  }

  function moveActiveIndex(direction: number) {
    const nextIndex = getNextComboBoxActiveIndex(activeIndex, totalRows, direction)
    if (nextIndex === null) return

    setActiveIndex(nextIndex)
    const list = optionsRef.current
    if (!list) return
    const optionTop = nextIndex * optionHeight
    const optionBottom = optionTop + optionHeight
    if (optionTop < list.scrollTop) list.scrollTop = optionTop
    else if (optionBottom > list.scrollTop + list.clientHeight) list.scrollTop = optionBottom - list.clientHeight
    setScrollTop(list.scrollTop)
  }

  return (
    <div className={`combo-box${open ? ' is-open' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="combo-box-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setOpen((current) => !current)
          updateSearch('')
          setActiveIndex(null)
        }}
      >
        <span className={selectedLabel ? '' : 'is-placeholder'}>
          {selectedLabel ?? placeholder}
          {selected?.description && <small>{selected.description}</small>}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="combo-box-menu">
          <div className="combo-box-search">
            <Search size={15} aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              role="combobox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={activeIndex === null ? undefined : `${listboxId}-option-${activeIndex}`}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveActiveIndex(1)
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveActiveIndex(-1)
                } else if (event.key === 'Enter') {
                  event.preventDefault()
                  if (activeIndex === null) return
                  if (hasCustomValue && activeIndex === 0) selectCustomValue()
                  else {
                    const optionIndex = activeIndex - (hasCustomValue ? 1 : 0)
                    const option = filteredOptions[optionIndex]?.option
                    if (option) selectOption(option)
                  }
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setOpen(false)
                  setActiveIndex(null)
                }
              }}
            />
          </div>
          {totalRows > 50 && (
            <p className="combo-box-result-count" role="status">
              {totalRows.toLocaleString('id-ID')} hasil · gunakan pencarian untuk mempersempit
            </p>
          )}
          <div
            className="combo-box-options"
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            aria-setsize={totalRows}
            ref={optionsRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            {visibleRange.paddingTop > 0 && <div aria-hidden="true" style={{ height: visibleRange.paddingTop }} />}
            {hasCustomValue && visibleRange.start === 0 && (
              <button
                type="button"
                role="option"
                aria-selected="false"
                aria-posinset={1}
                aria-setsize={totalRows}
                id={`${listboxId}-option-0`}
                className={`combo-box-option${activeIndex === 0 ? ' is-active' : ''}`}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={selectCustomValue}
              >
                <span>
                  <strong>Gunakan item baru: {search.trim()}</strong>
                  <small>Akan disimpan ke data sparepart saat BAP disimpan</small>
                </span>
              </button>
            )}
            {totalRows === 0 ? (
              <p className="combo-box-empty">Tidak ada pilihan yang cocok.</p>
            ) : (
              visibleOptions.map(({ option }, visibleIndex) => {
                const optionIndex = visibleRange.start - (hasCustomValue ? 1 : 0) + visibleIndex
                const rowIndex = optionIndex + (hasCustomValue ? 1 : 0)
                return (
                <button
                  type="button"
                  role="option"
                  id={`${listboxId}-option-${rowIndex}`}
                  aria-posinset={rowIndex + 1}
                  aria-setsize={totalRows}
                  aria-selected={option.value === value}
                  className={`combo-box-option${activeIndex === rowIndex ? ' is-active' : ''}`}
                  tabIndex={-1}
                  key={option.value}
                  onMouseEnter={() => setActiveIndex(rowIndex)}
                  onClick={() => selectOption(option)}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  {option.value === value && <Check size={15} aria-hidden="true" />}
                </button>
                )
              })
            )}
            {visibleRange.paddingBottom > 0 && <div aria-hidden="true" style={{ height: visibleRange.paddingBottom }} />}
          </div>
        </div>
      )}
    </div>
  )
}
