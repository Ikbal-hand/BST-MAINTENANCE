export function createComboBoxSearchIndex(options) {
  return options.map((option) => {
    const normalizedLabel = option.label.trim().toLocaleLowerCase()
    return {
      option,
      normalizedLabel,
      searchText: `${option.label} ${option.description ?? ''}`.toLocaleLowerCase(),
    }
  })
}

export function searchComboBoxOptions(options, search) {
  const normalizedSearch = search.trim().toLocaleLowerCase()
  if (!normalizedSearch) return { options, hasExactMatch: false }

  const matches = []
  let hasExactMatch = false
  for (const item of options) {
    if (item.normalizedLabel === normalizedSearch) hasExactMatch = true
    if (item.searchText.includes(normalizedSearch)) matches.push(item)
  }
  return { options: matches, hasExactMatch }
}

export function getVirtualOptionRange(total, scrollTop, viewportHeight, itemHeight, overscan = 4) {
  if (total <= 0 || itemHeight <= 0) {
    return { start: 0, end: 0, paddingTop: 0, paddingBottom: 0 }
  }

  const safeViewportHeight = Math.max(0, viewportHeight)
  const maxScrollTop = Math.max(0, total * itemHeight - safeViewportHeight)
  const safeScrollTop = Math.min(maxScrollTop, Math.max(0, scrollTop))
  const safeOverscan = Math.max(0, overscan)
  const start = Math.min(total, Math.max(0, Math.floor(safeScrollTop / itemHeight) - safeOverscan))
  const end = Math.max(start, Math.min(total, Math.ceil((safeScrollTop + safeViewportHeight) / itemHeight) + safeOverscan))
  return {
    start,
    end,
    paddingTop: start * itemHeight,
    paddingBottom: (total - end) * itemHeight,
  }
}

export function getNextComboBoxActiveIndex(activeIndex, total, direction) {
  if (total <= 0) return null
  if (activeIndex === null) return direction > 0 ? 0 : total - 1
  return Math.min(total - 1, Math.max(0, activeIndex + direction))
}
