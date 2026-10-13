import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import defaultHeaderSrc from "./invoice-header.png";

/* ============================================================================
 * Invoice — replika template Word "CETAK PDF Task - 1 BodyTemplate" (halaman invoice)
 *
 * - Ukuran/jarak diambil langsung dari template (twip → pt, 1 twip = 1/20 pt)
 * - Font Times New Roman 10pt, border 1pt hitam, A4 portrait
 * - Tanpa dependency selain React. Semua style inline (aman untuk html2canvas,
 *   react-to-print, window.print(), maupun Puppeteer/Playwright page.pdf()).
 * ========================================================================== */

/* ----------------------------- Types ------------------------------------- */

export type Money = number | string;

export interface InvoiceItem {
  /** <<[SERVICE]>> */
  service: ReactNode;
  /** <<[UNIT]>> */
  unit: Money;
  /** <<[HARGA SATUAN]>> */
  hargaSatuan: Money;
  /** Opsional. Default: unit × hargaSatuan (jika keduanya number) */
  subTotal?: Money;
}

/** Satu blok tabel (loop <<start:[BAP]>> … <<END>> pada template) */
export interface InvoiceSection {
  /** <<[JUDUL]>> */
  judul: ReactNode;
  /** <<[DESKRIPSI]>> */
  deskripsi?: ReactNode;
  /** Baris detail (loop <<Start: [Related Detail Baps]>>) */
  items: InvoiceItem[];
  /** <<[SUB TOTAL]>> pada baris TOTAL. Default: jumlah subTotal item */
  total?: Money;
}

export interface InvoiceProps {
  /** <<[BAP]>> — dipakai sebagai "NO INVOICE" */
  noInvoice: ReactNode;
  /** Kolom TANGGAL (di template dikosongkan) */
  tanggal?: ReactNode;
  toko: {
    /** <<[TOKO]>> */
    kode: ReactNode;
    /** <<[TOKO].[NAMA TOKO]>> */
    nama: ReactNode;
    /** <<[TOKO].[MILIK]>> */
    milik: ReactNode;
  };
  sections: InvoiceSection[];
  /** <<[TOTAL]>> — Default: jumlah total semua section */
  total?: Money;

  /** Gambar kop (logo + judul INVOICE + alamat). Default: /invoice-header.png */
  headerSrc?: string;
  /** Blok "Note" di kiri bawah */
  payment?: { label?: string; rekening: string; atasNama: string };
  /** Blok tanda tangan di kanan bawah */
  signer?: { salam?: string; nama: string; jabatan: string; signatureSrc?: string };
  /** Format angka rupiah. Default: "Rp 1.500.000" */
  formatMoney?: (n: number) => string;

  className?: string;
  style?: CSSProperties;
  /** Dirender tepat di bawah blok tanda tangan (mis. komponen <Kwitansi />) */
  children?: ReactNode;
  /**
   * Tinggi minimum baris Note/TTD dalam pt. Template memakai 167pt (ruang sebelum kwitansi).
   * Default: 167 jika ada `children`, selain itu mengikuti isi (agar tidak terlempar ke halaman baru).
   */
  noteMinHeight?: number;
}

/* ------------------------- Konstanta dari template ------------------------ */

const tw = (n: number) => `${n / 20}pt`; // twip → pt

const FONT = '"Times New Roman", Times, "Liberation Serif", Tinos, serif';
const LINE = 11.49; // tinggi 1 baris TNR 10pt "single" di Word (pt)
const LH = 1.149; // line-height single TNR
const LH_115 = LH * 1.15; // spacing 1.15 (w:line=276) dipakai blok Note/TTD
const BORDER = "1pt solid #000"; // w:sz=8
const PAD = "5pt"; // 100 twip cell margin default

const PAGE = { w: "210mm", h: "297mm" };
const SIDE = tw(561.6); // margin kiri/kanan
const BOTTOM = tw(288); // margin bawah
/** Jarak dari bawah gambar kop ke tabel pertama (paragraf kosong awal template) */
const BODY_TOP = "13pt";

const base: CSSProperties = {
  fontFamily: FONT,
  fontSize: "10pt",
  lineHeight: LH,
  color: "#000",
};

/* -------------------------------- Helpers -------------------------------- */

const defaultFormat = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const Gap = ({ lines = 1 }: { lines?: number }) => (
  <div style={{ height: `${lines * LINE}pt` }} />
);

/** Border per-sisi. 1 = garis, 0 = nil. Urutan: top, right, bottom, left */
const edges = (t: 0 | 1, r: 0 | 1, b: 0 | 1, l: 0 | 1): CSSProperties => ({
  borderTop: t ? BORDER : "none",
  borderRight: r ? BORDER : "none",
  borderBottom: b ? BORDER : "none",
  borderLeft: l ? BORDER : "none",
});

const td = (extra: CSSProperties = {}): CSSProperties => ({
  ...base,
  padding: PAD,
  verticalAlign: "top",
  boxSizing: "border-box",
  overflowWrap: "anywhere",
  ...extra,
});

const tableBase = (widthPt: number | string): CSSProperties => ({
  borderCollapse: "collapse",
  tableLayout: "fixed",
  width: typeof widthPt === "number" ? `${widthPt}pt` : widthPt,
});

const Cols = ({ tws }: { tws: number[] }) => (
  <colgroup>
    {tws.map((w, i) => (
      <col key={i} style={{ width: tw(w) }} />
    ))}
  </colgroup>
);

const toNum = (v: Money | undefined) => (typeof v === "number" ? v : undefined);

/* -------------------------------- Component ------------------------------ */

export function Invoice({
  noInvoice,
  tanggal,
  toko,
  sections,
  total,
  headerSrc = defaultHeaderSrc,
  payment = {
    label: "Silahkan transfer ke rekening:",
    rekening: "0548985555 (BCA)",
    atasNama: "a/n BERKARYA SATU TUJUAN CV",
  },
  signer = {
    salam: "Hormat Kami,",
    nama: "Muhamad Zidan Fauzan",
    jabatan: "(Service Admin)",
  },
  formatMoney = defaultFormat,
  className,
  style,
  children,
  noteMinHeight = children ? 167 : 0,
}: InvoiceProps) {
  const money = (v: Money | undefined) =>
    v === undefined ? "" : typeof v === "number" ? formatMoney(v) : v;
  const qty = (v: Money) => (typeof v === "number" ? v.toLocaleString("id-ID") : v);

  // --- hitung otomatis bila tidak disuplai ---
  const computed = sections.map((s) => {
    const rows = s.items.map((it) => ({
      ...it,
      sub:
        it.subTotal ??
        (typeof it.unit === "number" && typeof it.hargaSatuan === "number"
          ? it.unit * it.hargaSatuan
          : undefined),
    }));
    const sectionTotal =
      s.total ?? rows.reduce((sum, r) => sum + (toNum(r.sub) ?? 0), 0);
    return { ...s, rows, sectionTotal };
  });
  const grandTotal =
    total ?? computed.reduce((sum, s) => sum + (toNum(s.sectionTotal) ?? 0), 0);

  const rootStyle: CSSProperties = {
    ...base,
    width: PAGE.w,
    minHeight: PAGE.h,
    margin: "0 auto",
    background: "#fff",
    boxSizing: "border-box",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
    ...style,
  };

  return (
    <div className={`invoice-root ${className ?? ""}`.trim()} style={rootStyle}>
      {/* A4 tanpa margin bawaan browser: margin diatur di dalam komponen */}
      <style>{`@page { size: A4 portrait; margin: 0; }
.invoice-root tr { break-inside: avoid; page-break-inside: avoid; }
.invoice-root thead { display: table-header-group; }
.invoice-root tfoot { display: table-footer-group; }`}</style>

      {/* Wrapper: <thead> = kop surat (berulang di tiap halaman saat dicetak
          oleh Chromium, sama seperti header Word), <tfoot> = margin bawah. */}
      <table role="presentation" style={{ ...tableBase("100%"), height: "100%" }}>
        <thead>
          <tr>
            <td style={{ padding: `0 ${SIDE}` }}>
              <img
                src={headerSrc}
                alt=""
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td style={{ padding: `${BODY_TOP} ${SIDE} 0`, verticalAlign: "top" }}>
              {/* ======================= BILL TO / NO INVOICE ======================= */}
              <table style={tableBase(539)}>
                <Cols tws={[4440, 1520, 2280, 2540]} />
                <tbody>
                  <tr style={{ height: tw(330) }}>
                    <td style={td({ ...edges(1, 1, 1, 1), textAlign: "center", fontWeight: 700 })}>
                      BILL TO
                    </td>
                    <td style={td(edges(0, 1, 0, 1))} />
                    <td style={td({ ...edges(1, 1, 1, 1), fontWeight: 700 })}>NO INVOICE :</td>
                    <td style={td({ ...edges(1, 1, 1, 1), fontWeight: 700 })}>TANGGAL :</td>
                  </tr>
                  <tr style={{ height: tw(145) }}>
                    <td rowSpan={2} style={td({ ...edges(1, 1, 1, 1), fontWeight: 700 })}>
                      {toko.milik}
                    </td>
                    <td style={td(edges(0, 1, 0, 1))} />
                    <td style={td({ ...edges(1, 1, 1, 1), fontWeight: 700 })}>{noInvoice}</td>
                    <td style={td(edges(1, 1, 1, 1))}>{tanggal}</td>
                  </tr>
                  <tr style={{ height: tw(420) }}>
                    <td style={td(edges(0, 0, 0, 1))} />
                    <td style={td(edges(1, 0, 0, 0))} />
                    <td style={td(edges(1, 0, 0, 0))} />
                  </tr>
                  <tr style={{ height: tw(420) }}>
                    <td style={td(edges(1, 1, 1, 1))}>
                      <div>TOKO : {toko.nama}</div>
                      <div>KODE : {toko.kode}</div>
                    </td>
                    <td style={td(edges(0, 0, 0, 1))} />
                    <td style={td(edges(0, 0, 0, 0))} />
                    <td style={td(edges(0, 0, 0, 0))} />
                  </tr>
                </tbody>
              </table>

              <Gap lines={2} />

              {/* ============================ DETAIL PESANAN ============================ */}
              <div
                style={{
                  ...base,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "13pt",
                }}
              >
                DETAIL PESANAN
              </div>
              <Gap />

              {/* ====================== Satu tabel per section ====================== */}
              {computed.map((s, si) => (
                <React.Fragment key={si}>
                  <table style={{ ...tableBase(539), margin: "0 auto" }}>
                    <Cols tws={[6000, 720, 2040, 2020]} />
                    {/* thead: judul kolom ikut pindah halaman & tidak tertinggal sendirian */}
                    <thead>
                      <tr>
                        <td style={td({ border: BORDER, textAlign: "center", whiteSpace: "pre-wrap" })}>
                          {s.judul}
                          {s.deskripsi != null && s.deskripsi !== "" ? (
                            <>
                              {"  "}
                              {s.deskripsi}
                            </>
                          ) : null}
                        </td>
                        {["UNIT", "HARGA SATUAN", "SUB TOTAL"].map((h) => (
                          <td
                            key={h}
                            style={td({ border: BORDER, textAlign: "center", fontWeight: 700 })}
                          >
                            {h}
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.rows.map((r, ri) => (
                        <tr key={ri}>
                          <td style={td({ border: BORDER })}>{r.service}</td>
                          <td style={td({ border: BORDER, textAlign: "center" })}>{qty(r.unit)}</td>
                          <td style={td({ border: BORDER, textAlign: "right" })}>
                            {money(r.hargaSatuan)}
                          </td>
                          <td style={td({ border: BORDER, textAlign: "right" })}>{money(r.sub)}</td>
                        </tr>
                      ))}

                      <tr style={{ height: tw(400) }}>
                        <td colSpan={3} style={td({ border: BORDER, textAlign: "right" })}>
                          TOTAL
                        </td>
                        <td style={td({ border: BORDER, textAlign: "right" })}>
                          {money(s.sectionTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Gap lines={2} />
                </React.Fragment>
              ))}

              {/* ========================== TOTAL KESELURUHAN ========================== */}
              <table style={{ ...tableBase(551), marginLeft: tw(-235) }}>
                <Cols tws={[9000, 2020]} />
                <tbody>
                  <tr>
                    <td style={td({ textAlign: "right", fontWeight: 700 })}>TOTAL KESELURUHAN :</td>
                    <td style={td({ textAlign: "right", fontWeight: 700 })}>{money(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <Gap lines={3} />

              {/* ========================== Note + Tanda tangan ========================== */}
              <table style={tableBase(540)}>
                <Cols tws={[4720, 2440, 3640]} />
                <tbody>
                  <tr style={{ height: noteMinHeight ? `${noteMinHeight}pt` : undefined }}>
                    <td style={td({ padding: `0 ${PAD}`, lineHeight: LH_115 })}>
                      <div style={{ marginTop: "12pt", fontWeight: 700, textDecoration: "underline" }}>
                        Note :
                      </div>
                      <div style={{ marginTop: "12pt" }}>{payment.label ?? "Silahkan transfer ke rekening:"}</div>
                      <div style={{ marginTop: "12pt", height: `${LINE * 1.15}pt` }} />
                      <div style={{ height: `${LINE * 1.15}pt` }} />
                      <div style={{ fontWeight: 700 }}>{payment.rekening}</div>
                      <div style={{ fontWeight: 700 }}>{payment.atasNama}</div>
                    </td>
                    <td style={td({ padding: `0 ${PAD}`, lineHeight: LH_115 })} />
                    <td style={td({ padding: `0 ${PAD}`, lineHeight: LH_115, textAlign: "center" })}>
                      <div style={{ marginTop: "12pt" }}>{signer.salam ?? "Hormat Kami,"}</div>
                      {signer.signatureSrc ? (
                        <div style={{ margin: "4pt 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img
                            src={signer.signatureSrc}
                            alt=""
                            style={{ maxHeight: "65px", maxWidth: "140px", objectFit: "contain", display: "block" }}
                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ marginTop: "12pt", height: `${LINE * 1.15}pt` }} />
                          <div style={{ height: `${LINE * 1.15}pt` }} />
                        </>
                      )}
                      <div style={{ marginTop: signer.signatureSrc ? "4pt" : "14pt", lineHeight: LH }}>{signer.nama}</div>
                      <div style={{ lineHeight: LH }}>{signer.jabatan}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {children ? (
                <>
                  <Gap lines={2} />
                  {children}
                </>
              ) : null}
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td style={{ height: BOTTOM, padding: 0 }} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default Invoice;
