import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createComboBoxSearchIndex,
  getNextComboBoxActiveIndex,
  getVirtualOptionRange,
  searchComboBoxOptions,
} from './combo-box-utils.js'

const options = Array.from({ length: 10_000 }, (_, index) => ({
  value: `store-${index}`,
  label: `Cabang Bandung ${index}`,
  description: `B${String(index).padStart(5, '0')} · REG`,
}))
const searchIndex = createComboBoxSearchIndex(options)

test('searches large option lists by label and description and preserves exact-match detection', () => {
  const byLabel = searchComboBoxOptions(searchIndex, 'CABANG BANDUNG 9999')
  assert.deepEqual(byLabel.options.map(({ option }) => option.value), ['store-9999'])
  assert.equal(byLabel.hasExactMatch, true)

  const byDescription = searchComboBoxOptions(searchIndex, 'B09999')
  assert.deepEqual(byDescription.options.map(({ option }) => option.value), ['store-9999'])
  assert.equal(byDescription.hasExactMatch, false)
})

test('virtualizes the first, middle, and final ranges of a 10,000-option list', () => {
  const rowHeight = 52
  const viewportHeight = 230
  const total = options.length
  const ranges = [
    getVirtualOptionRange(total, 0, viewportHeight, rowHeight),
    getVirtualOptionRange(total, 5_000 * rowHeight, viewportHeight, rowHeight),
    getVirtualOptionRange(total, (total - 1) * rowHeight, viewportHeight, rowHeight),
  ]

  for (const range of ranges) {
    assert.ok(range.end > range.start)
    assert.ok(range.end - range.start <= 14)
    assert.equal(range.paddingTop, range.start * rowHeight)
    assert.equal(range.paddingBottom, (total - range.end) * rowHeight)
  }
  assert.equal(ranges[0]?.start, 0)
  assert.ok((ranges[1]?.start ?? 0) <= 5_000)
  assert.ok((ranges[1]?.end ?? 0) > 5_000)
  assert.ok((ranges[2]?.end ?? 0) <= total)
})

test('handles empty results and invalid viewport sizes safely', () => {
  assert.deepEqual(searchComboBoxOptions(searchIndex, 'missing item'), {
    options: [],
    hasExactMatch: false,
  })
  assert.deepEqual(getVirtualOptionRange(0, 0, 230, 52), {
    start: 0,
    end: 0,
    paddingTop: 0,
    paddingBottom: 0,
  })
  assert.deepEqual(getVirtualOptionRange(10, -10, -20, 0), {
    start: 0,
    end: 0,
    paddingTop: 0,
    paddingBottom: 0,
  })
  assert.deepEqual(getVirtualOptionRange(10, 100_000, 230, 52), {
    start: 1,
    end: 10,
    paddingTop: 52,
    paddingBottom: 0,
  })
})

test('moves keyboard selection through virtualized rows without skipping boundaries', () => {
  assert.equal(getNextComboBoxActiveIndex(null, 10_000, 1), 0)
  assert.equal(getNextComboBoxActiveIndex(0, 10_000, -1), 0)
  assert.equal(getNextComboBoxActiveIndex(5_000, 10_000, 1), 5_001)
  assert.equal(getNextComboBoxActiveIndex(9_999, 10_000, 1), 9_999)
  assert.equal(getNextComboBoxActiveIndex(null, 0, 1), null)
})
