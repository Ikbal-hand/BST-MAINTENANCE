import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { RecapSummary } from './recaps-api'

const styles = StyleSheet.create({
  page: {
    padding: '12mm 14mm',
    color: '#111',
    fontFamily: 'Times-Roman',
    fontSize: 10,
  },
  header: {
    minHeight: '27mm',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '5mm',
  },
  contact: {
    width: '34%',
    fontSize: 7,
    lineHeight: 1.35,
  },
  contactLine: {
    marginBottom: '1mm',
  },
  logo: {
    width: '30mm',
    height: '19mm',
    objectFit: 'contain',
  },
  handover: {
    width: '37%',
    borderTop: '0.25mm solid #111',
    borderLeft: '0.25mm solid #111',
  },
  handoverRow: {
    flexDirection: 'row',
  },
  handoverCell: {
    width: '50%',
    minHeight: '7mm',
    justifyContent: 'center',
    borderRight: '0.25mm solid #111',
    borderBottom: '0.25mm solid #111',
    padding: '1mm',
    textAlign: 'center',
    fontSize: 8,
  },
  handoverStrong: {
    fontFamily: 'Times-Bold',
  },
  handoverFull: {
    width: '100%',
  },
  handoverNames: {
    textAlign: 'left',
  },
  title: {
    marginTop: '4mm',
    marginBottom: '5mm',
    fontSize: 14,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
  },
  types: {
    marginBottom: '5mm',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '3mm',
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1.5mm',
    fontSize: 9,
  },
  typeLabel: {
    marginRight: '3mm',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2mm',
    fontFamily: 'Times-Bold',
  },
  checkbox: {
    width: '9mm',
    height: '5.5mm',
    border: '0.3mm solid #111',
  },
  fields: {
    marginBottom: '2mm',
    gap: '1.5mm',
  },
  fieldRow: {
    minHeight: '5mm',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '1mm',
  },
  fieldLabel: {
    width: '38mm',
    fontFamily: 'Times-Bold',
  },
  fieldColon: {
    width: '4mm',
  },
  dottedLine: {
    flex: 1,
    borderBottom: '0.3mm dotted #111',
  },
  storeLabel: {
    marginBottom: 0,
    flexDirection: 'row',
    gap: '1mm',
    fontFamily: 'Times-Bold',
  },
  storeTable: {
    width: '77%',
    marginLeft: '42mm',
    borderTop: '0.25mm solid #111',
    borderLeft: '0.25mm solid #111',
  },
  storeRow: {
    flexDirection: 'row',
  },
  storeCell: {
    minHeight: '5mm',
    justifyContent: 'center',
    borderRight: '0.25mm solid #111',
    borderBottom: '0.25mm solid #111',
    padding: '0.8mm 1mm',
    fontSize: 9,
    lineHeight: 1.15,
  },
  storeName: {
    width: '67%',
  },
  storeAmount: {
    width: '24%',
    textAlign: 'right',
  },
  storeType: {
    width: '9%',
    textAlign: 'center',
  },
  totalRow: {
    fontFamily: 'Times-Bold',
  },
  paymentDate: {
    marginTop: '5mm',
  },
})

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`))

export function RecapPdfDocument({ data, logo }: { data: RecapSummary; logo: string }) {
  const storeTypes = new Map(data.invoices.map((invoice) => [invoice.store.id, invoice.store.storeType]))

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.contact}>
            <Text style={styles.contactLine}>
              Perum Marga Mulya Indah{'\n'}
              Desa Cikunir Kec. Singaparna,{'\n'}
              Tasikmalaya
            </Text>
            <Text style={styles.contactLine}>
              Email: cvbstteknik@gmail.com{'\n'}
              Telp: 081214245300 / 081224642959{'\n'}
              No./Tgl: {formatDate(data.period.from)} - {formatDate(data.period.to)}
            </Text>
          </View>
          <Image src={logo} style={styles.logo} />
          <View style={styles.handover}>
            <View style={styles.handoverRow}>
              <Text style={[styles.handoverCell, styles.handoverStrong]}>Diserahkan</Text>
              <Text style={[styles.handoverCell, styles.handoverStrong]}>Diterima</Text>
            </View>
            <View style={styles.handoverRow}>
              <Text style={[styles.handoverCell, styles.handoverFull, styles.handoverStrong]}>CV. BST</Text>
            </View>
            <View style={styles.handoverRow}>
              <Text style={[styles.handoverCell, styles.handoverNames]}>Bpk/Ibu................</Text>
              <Text style={[styles.handoverCell, styles.handoverNames]}>Bpk/Ibu................</Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>TANDA SERAH TERIMA</Text>
        <View style={styles.types}>
          <View style={styles.typeLabel}>
            <Text>✓</Text>
            <Text>Jenis</Text>
          </View>
          {['Dokumen', 'Tagihan', 'Giro/cek', 'Lain-Lain'].map((label) => (
            <View style={styles.typeItem} key={label}>
              <View style={styles.checkbox} />
              <Text>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.fields}>
          {['Sudah diterima', 'Jumlah', 'Keterangan'].map((label) => (
            <View style={styles.fieldRow} key={label}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <Text style={styles.fieldColon}>:</Text>
              <View style={styles.dottedLine} />
            </View>
          ))}
        </View>
        <View style={styles.storeLabel}>
          <Text style={styles.fieldLabel}>Nama Toko</Text>
          <Text style={styles.fieldColon}>:</Text>
        </View>
        <View style={styles.storeTable}>
          {data.stores.map((store) => (
            <View style={styles.storeRow} key={store.storeId} wrap={false}>
              <Text style={[styles.storeCell, styles.storeName]}>{store.name} ({store.code})</Text>
              <Text style={[styles.storeCell, styles.storeAmount]}>{currency.format(store.invoiceTotal)}</Text>
              <Text style={[styles.storeCell, styles.storeType]}>{storeTypes.get(store.storeId) ?? ''}</Text>
            </View>
          ))}
          <View style={[styles.storeRow, styles.totalRow]} wrap={false}>
            <Text style={[styles.storeCell, styles.storeName]}>TOTAL :</Text>
            <Text style={[styles.storeCell, styles.storeAmount]}>{currency.format(data.summary.invoiceTotal)}</Text>
            <Text style={[styles.storeCell, styles.storeType]} />
          </View>
        </View>
        <View style={[styles.fieldRow, styles.paymentDate]}>
          <Text style={styles.fieldLabel}>Tanggal Pembayaran</Text>
          <Text style={styles.fieldColon}>:</Text>
          <View style={styles.dottedLine} />
        </View>
      </Page>
    </Document>
  )
}
