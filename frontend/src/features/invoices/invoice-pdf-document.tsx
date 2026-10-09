import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { type Invoice } from './invoices-api'
import { type WorkspaceSettings } from '../settings/settings-api'

const styles = StyleSheet.create({
  page: {
    padding: '17mm 16mm',
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#111',
    backgroundColor: '#fff',
  },
  receiptPage: {
    padding: '18mm 8mm',
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#142b3d',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: '3mm',
  },
  headerLeft: { width: '34%', alignItems: 'center' },
  headerCenter: { width: '32%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '2mm' },
  headerRight: { width: '34%', fontSize: 8, lineHeight: 1.3 },
  logo: { width: '48mm', height: '24mm', objectFit: 'contain', marginBottom: 5 },
  logoText: { color: '#e30613', fontSize: 37, fontFamily: 'Helvetica-Bold', letterSpacing: -2 },
  companyName: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 5 },
  companyNameRight: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  docType: { fontSize: 21, fontFamily: 'Helvetica-Bold', textDecoration: 'underline' },
  metaRow: { flexDirection: 'row', marginTop: '3mm' },
  metaBox: { width: '49%', height: '32mm', border: '1pt solid #111' },
  metaSpacer: { width: '2%' },
  billToTitle: { padding: 5, textAlign: 'center', borderBottom: '1pt solid #111', fontFamily: 'Helvetica-Bold' },
  billToCompany: { padding: 7, fontFamily: 'Helvetica-Bold', minHeight: '13mm' },
  billToAddress: { padding: 7, borderTop: '1pt solid #111' },
  invNumTitle: { padding: 7, width: '50%', fontFamily: 'Helvetica-Bold' },
  invNumDate: { padding: 7, width: '50%', borderLeft: '1pt solid #111' },
  invNumRow: { flexDirection: 'row' },
  sectionTitle: { marginTop: '14mm', marginBottom: '4mm', textAlign: 'center', fontSize: 15, fontFamily: 'Helvetica-Bold' },
  table: { width: '100%', marginBottom: '8mm', borderTop: '1pt solid #111', borderLeft: '1pt solid #111' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#fff', fontFamily: 'Helvetica-Bold', textAlign: 'center', borderBottom: '1pt solid #111', fontSize: 9.5 },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #111' },
  th1: { width: '52%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'left' },
  th2: { width: '9%', padding: '8px 7px', borderRight: '1pt solid #111' },
  th3: { width: '19.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right' },
  th4: { width: '19.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right' },
  td1: { width: '52%', padding: '8px 7px', borderRight: '1pt solid #111' },
  td2: { width: '9%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'center' },
  td3: { width: '19.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right' },
  td4: { width: '19.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right' },
  subtotalRow: { flexDirection: 'row', borderBottom: '1pt solid #111' },
  subtotalTitle: { width: '80.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  subtotalAmount: { width: '19.5%', padding: '8px 7px', borderRight: '1pt solid #111', textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: '12mm', fontFamily: 'Helvetica-Bold' },
  grandTotalText: { marginRight: '24mm' },
  footer: { flexDirection: 'row', marginTop: '18mm' },
  noteBox: { flex: 1, lineHeight: 1.45 },
  signBox: { width: '48mm', textAlign: 'center', lineHeight: 1.45 },
  signatureImg: { width: '35mm', height: '18mm', objectFit: 'contain', alignSelf: 'center', marginVertical: 5 },

  receiptTitle: { alignSelf: 'center', fontSize: 17, letterSpacing: 1, marginBottom: '10mm', fontFamily: 'Helvetica-Bold' },
  receiptTicket: { width: '100%', height: '73.5mm', position: 'relative' },
  receiptBg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  receiptField: { position: 'absolute', fontSize: 10, fontFamily: 'Helvetica-Bold' },
  receiptNumber: { top: '10%', left: '27%', width: '66%' },
  receiptRecipient: { top: '19%', left: '38%', width: '55%' },
  receiptAmountWords: { top: '30%', left: '38%', width: '55%' },
  receiptPurpose: { top: '42.5%', left: '39%', width: '54%' },
  receiptCash: { position: 'absolute', left: '33%', bottom: '14%', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  receiptSignBlock: { position: 'absolute', right: '1%', bottom: '7%', width: '36%', height: '24%', alignItems: 'center', justifyContent: 'flex-end' },
  receiptSignImg: { width: '84%', height: '60%', objectFit: 'contain', transform: 'translateY(5mm)' },
  receiptSigner: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center', marginTop: 10 },
})

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 })
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))

export function InvoicePdfDocument({
  invoice,
  documentType,
  settings,
  receiptImage,
}: {
  invoice: Invoice
  documentType: 'invoice' | 'sph'
  settings?: WorkspaceSettings
  receiptImage?: string
}) {
  const baps = (invoice.baps.length ? invoice.baps : invoice.bap ? [invoice.bap] : []).filter(
    (bap): bap is NonNullable<typeof bap> => Boolean(bap),
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {settings?.logoDataUrl ? (
              <Image src={settings.logoDataUrl} style={styles.logo} />
            ) : (
              <Text style={styles.logoText}>BST</Text>
            )}
            <Text style={styles.companyName}>CV. BERKARYA SATU TUJUAN</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.docType}>{documentType === 'sph' ? 'SPH' : 'INVOICE'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyNameRight}>CV. BERKARYA SATU TUJUAN</Text>
            <Text>Kp. Cilamajang, RT/RW. 004/006, Kel. Cipawitra,</Text>
            <Text>Kec. Mangkubumi, Kota Tasikmalaya, 46181</Text>
            <Text style={{ marginTop: 5 }}>No Telp. 081214245300</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.billToTitle}>BILL TO</Text>
            <Text style={styles.billToCompany}>{invoice.store.ownerCompany ?? '—'}</Text>
            <View style={styles.billToAddress}>
              <Text>TOKO : {invoice.store.name}</Text>
              <Text>KODE : {invoice.store.code}</Text>
            </View>
          </View>
          <View style={styles.metaSpacer} />
          <View style={styles.metaBox}>
            <View style={[styles.invNumRow, { flex: 1 }]}>
              <View style={styles.invNumTitle}>
                <Text>{documentType === 'sph' ? 'NO SPH' : 'NO INVOICE'}</Text>
                <Text>{invoice.number}</Text>
              </View>
              <View style={styles.invNumDate}>
                <Text>TANGGAL :</Text>
                <Text>{formatDate(invoice.date)}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DETAIL PESANAN</Text>

        {baps.map((bap) => (
          <View style={styles.table} key={bap.id}>
            <View style={styles.tableHeader}>
              <Text style={styles.th1}>{bap.title}{bap.description ? ` ${bap.description}` : ''}</Text>
              <Text style={styles.th2}>UNIT</Text>
              <Text style={styles.th3}>HARGA SATUAN</Text>
              <Text style={styles.th4}>SUB TOTAL</Text>
            </View>
            {bap.items.map((item) => (
              <View style={styles.tableRow} key={item.id ?? item.sortOrder}>
                <Text style={styles.td1}>{item.serviceName}</Text>
                <Text style={styles.td2}>{item.unit}</Text>
                <Text style={styles.td3}>{currency.format(item.unitPrice)}</Text>
                <Text style={styles.td4}>{currency.format(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalTitle}>TOTAL</Text>
              <Text style={styles.subtotalAmount}>{currency.format(bap.totalAmount)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalText}>TOTAL KESELURUHAN :</Text>
          <Text>{currency.format(invoice.totalAmount)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.noteBox}>
            <Text style={{ fontFamily: 'Helvetica-Bold', textDecoration: 'underline' }}>Note :</Text>
            <Text style={{ marginVertical: 14 }}>Silahkan transfer ke rekening:</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {settings?.bankAccount ?? '0548985555'} ({settings?.bankName ?? 'BCA'})
            </Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              a/n {settings?.bankAccountName ?? 'BERKARYA SATU TUJUAN CV'}
            </Text>
          </View>
          <View style={styles.signBox}>
            <Text style={{ marginBottom: 5 }}>Hormat Kami,</Text>
            {settings?.signatureDataUrl && (
              <Image src={settings.signatureDataUrl} style={styles.signatureImg} />
            )}
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 5 }}>
              {settings?.signerName ?? 'Muhamad Zidan Fauzan'}
            </Text>
            <Text style={{ fontSize: 10 }}>(Service Admin)</Text>
          </View>
        </View>
      </Page>

      {documentType === 'invoice' && (
        <Page size="A4" orientation="landscape" style={{ padding: '12mm' }}>
          {receiptImage ? (
             <Image src={receiptImage} style={{ width: '100%', objectFit: 'contain' }} />
          ) : (
            <View>
               <Text>Kuitansi HTML belum ter-render atau gambar tidak tersedia.</Text>
            </View>
          )}
        </Page>
      )}
    </Document>
  )
}
