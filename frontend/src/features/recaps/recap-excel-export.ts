import * as XLSX from 'xlsx'
import type { RecapSummary } from './recaps-api'
import type { WorkspaceSettings } from '../settings/settings-api'

const formatItemNames = (invoice: RecapSummary['invoices'][number]) => {
  const baps = invoice.invoiceBaps.map((relation) => relation.bap)
  if (invoice.bap) baps.unshift(invoice.bap)
  const descriptions = baps.flatMap((bap) => [
    bap.title,
    bap.description,
    ...bap.items.map((item) => item.serviceName),
  ])
  const itemNames = [...new Set(descriptions.map((description) => description?.trim()).filter(Boolean))]
  if (!itemNames.length && invoice.purpose?.trim()) itemNames.push(invoice.purpose.trim())
  return itemNames.join(', ')
}

export function createRecapWorkbook(
  data: RecapSummary,
  settings?: WorkspaceSettings,
  createdAt = new Date(),
) {
  const workbook = XLSX.utils.book_new()
  const createdDate = new Date(createdAt)
  createdDate.setHours(0, 0, 0, 0)
  const rows: (string | number | Date)[][] = [
    [`Tanggal di Buat: ${new Intl.DateTimeFormat('id-ID').format(createdDate)}`],
    [],
    ['Tanggal', 'NO INVOICE', 'KD TOKO', 'NAMA TOKO', 'R/F', 'NAMA BARANG', 'TOTAL', 'NO REK', 'A/N', 'BANK'],
    ...data.invoices.map((invoice) => [
      new Date(`${invoice.date.slice(0, 10)}T00:00:00`),
      invoice.number,
      invoice.store.code,
      invoice.store.name,
      invoice.store.storeType,
      formatItemNames(invoice),
      invoice.totalAmount,
      settings?.bankAccount ?? '0548985555',
      settings?.bankAccountName ?? 'BERKARYA SATU TUJUAN CV',
      settings?.bankName ?? 'BCA',
    ]),
    [],
    ['TOTAL', '', '', '', '', '', data.summary.invoiceTotal],
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 8 },
    { wch: 30 }, { wch: 19 }, { wch: 16 }, { wch: 28 }, { wch: 10 },
  ]
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }]
  sheet['!autofilter'] = { ref: `A3:J${Math.max(3, data.invoices.length + 3)}` }
  sheet['!freeze'] = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activePane: 'bottomLeft', state: 'frozen' }
  sheet['!pageSetup'] = { orientation: 'landscape', paperSize: 9 }
  sheet['!margins'] = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
  for (let row = 3; row < data.invoices.length + 3; row += 1) {
    const dateCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    if (dateCell) dateCell.z = 'dd/mm/yyyy'
    const totalCell = sheet[XLSX.utils.encode_cell({ r: row, c: 6 })]
    if (totalCell) totalCell.z = '"Rp"#,##0.00'
  }
  const summaryTotalCell = sheet[XLSX.utils.encode_cell({ r: data.invoices.length + 4, c: 6 })]
  if (summaryTotalCell) summaryTotalCell.z = '"Rp"#,##0.00'
  XLSX.utils.book_append_sheet(workbook, sheet, 'Rekap Invoice')
  return workbook
}

export function downloadRecapExcel(
  data: RecapSummary,
  settings?: WorkspaceSettings,
) {
  const workbook = createRecapWorkbook(data, settings)
  XLSX.writeFile(workbook, `rekap-invoice-${data.period.from}-${data.period.to}.xlsx`)
}
