import type { ComboBoxOption } from './combo-box'

export interface SearchableComboBoxOption {
  option: ComboBoxOption
  normalizedLabel: string
  searchText: string
}

export interface ComboBoxSearchResult {
  options: SearchableComboBoxOption[]
  hasExactMatch: boolean
}

export interface VirtualOptionRange {
  start: number
  end: number
  paddingTop: number
  paddingBottom: number
}

export function createComboBoxSearchIndex(options: ComboBoxOption[]): SearchableComboBoxOption[]
export function searchComboBoxOptions(
  options: SearchableComboBoxOption[],
  search: string,
): ComboBoxSearchResult
export function getVirtualOptionRange(
  total: number,
  scrollTop: number,
  viewportHeight: number,
  itemHeight: number,
  overscan?: number,
): VirtualOptionRange
export function getNextComboBoxActiveIndex(
  activeIndex: number | null,
  total: number,
  direction: number,
): number | null
