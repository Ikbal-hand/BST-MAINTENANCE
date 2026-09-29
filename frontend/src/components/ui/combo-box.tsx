import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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
}

export function ComboBox({
  value,
  options,
  onChange,
  placeholder = 'Pilih opsi',
  searchPlaceholder = 'Cari...',
  ariaLabel,
  disabled = false,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    if (!normalizedSearch) return options
    return options.filter((option) => `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(normalizedSearch))
  }, [options, search])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function selectOption(option: ComboBoxOption) {
    onChange(option.value)
    setSearch('')
    setOpen(false)
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
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? '' : 'is-placeholder'}>
          {selected?.label ?? placeholder}
          {selected?.description && <small>{selected.description}</small>}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="combo-box-menu" role="listbox" aria-label={ariaLabel}>
          <div className="combo-box-search">
            <Search size={15} aria-hidden="true" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
          <div className="combo-box-options">
            {filteredOptions.length === 0 ? (
              <p className="combo-box-empty">Tidak ada pilihan yang cocok.</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="combo-box-option"
                  key={option.value}
                  onClick={() => selectOption(option)}
                >
                  <span>
                    <strong>{option.label}</strong>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  {option.value === value && <Check size={15} aria-hidden="true" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
