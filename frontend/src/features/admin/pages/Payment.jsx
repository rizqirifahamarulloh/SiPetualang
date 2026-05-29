import { useState, useRef, useEffect } from "react";
import { 
  Search, Download, Eye, RefreshCw, 
  MoreHorizontal, CreditCard, DollarSign, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, Image as ImageIcon, X, Printer
} from "lucide-react";

const DUMMY_PAYMENTS = [
  {
    id_pembayaran: "PAY-2310-001",
    id_transaksi: "TRX-8821A",
    penyewa: "Budi Santoso",
    metode_bayar: "Transfer Bank - BCA",
    jumlah: 450000,
    deposit: 200000,
    status: "Lunas",
    waktu_bayar: "12 Okt 2023, 14:30",
    bukti_bayar: "ada"
  },
  {
    id_pembayaran: "PAY-2310-002",
    id_transaksi: "TRX-8822B",
    penyewa: "Siti Aminah",
    metode_bayar: "E-Wallet - GoPay",
    jumlah: 1200000,
    deposit: 500000,
    status: "Menunggu",
    waktu_bayar: "-",
    bukti_bayar: "ada"
  },
  {
    id_pembayaran: "PAY-2310-003",
    id_transaksi: "TRX-8823C",
    penyewa: "Rudi Hermawan",
    metode_bayar: "Cash",
    jumlah: 850000,
    deposit: 50000,
    status: "Gagal",
    waktu_bayar: "11 Okt 2023, 09:15",
    bukti_bayar: "-"
  },
  {
    id_pembayaran: "PAY-2310-004",
    id_transaksi: "TRX-8824D",
    penyewa: "Andi Wijaya",
    metode_bayar: "Transfer Bank - Mandiri",
    jumlah: 650000,
    deposit: 300000,
    status: "Lunas",
    waktu_bayar: "10 Okt 2023, 16:45",
    bukti_bayar: "ada"
  },
  {
    id_pembayaran: "PAY-2310-005",
    id_transaksi: "TRX-8825E",
    penyewa: "Dewi Lestari",
    metode_bayar: "E-Wallet - OVO",
    jumlah: 320000,
    deposit: 150000,
    status: "Lunas",
    waktu_bayar: "10 Okt 2023, 11:20",
    bukti_bayar: "ada"
  }
];

const formatHarga = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

function ActionMenu({ onViewDetail, onConfirmStatus, onPrint }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button onClick={() => setOpen(!open)} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-muted rounded-lg transition bg-transparent border-none cursor-pointer">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          <button onClick={() => { onViewDetail(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground text-left bg-transparent border-none cursor-pointer">
            <Eye size={14} className="text-muted-foreground" /> Detail Pembayaran
          </button>
          <button onClick={() => { onConfirmStatus(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground text-left bg-transparent border-none cursor-pointer">
            <CheckCircle2 size={14} className="text-emerald-600" /> Konfirmasi Lunas
          </button>
          <button onClick={() => { onPrint(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground text-left border-t border-border bg-transparent border-none cursor-pointer">
            <Printer size={14} className="text-muted-foreground" /> Cetak Invoice
          </button>
        </div>
      )}
    </div>
  );
}

export default function Payment() {
  const [payments] = useState(DUMMY_PAYMENTS);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState("2023-10-01");
  const [metode, setMetode] = useState("Semua Metode");
  const [previewBukti, setPreviewBukti] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { 
    setCurrentPage(1); 
  }, [search, metode]);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = 
      p.id_pembayaran.toLowerCase().includes(search.toLowerCase()) ||
      p.id_transaksi.toLowerCase().includes(search.toLowerCase()) ||
      p.penyewa.toLowerCase().includes(search.toLowerCase());

    const matchesMetode = 
      metode === "Semua Metode" || 
      p.metode_bayar.toLowerCase().includes(metode.toLowerCase());

    return matchesSearch && matchesMetode;
  });

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        nums.push(i);
      } else if (nums[nums.length - 1] !== "...") {
        nums.push("...");
      }
    }
    return nums;
  };

  const handleResetFilter = () => {
    setSearch("");
    setMetode("Semua Metode");
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Dashboard &gt; Pembayaran</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pembayaran</h1>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-xl text-xs font-semibold bg-card text-foreground hover:bg-muted transition shadow-xs cursor-pointer">
          <Download size={14} /> Ekspor ke CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Filter 1: Cari Transaksi */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Cari Transaksi</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-xl bg-card text-foreground focus:outline-none focus:border-emerald-600 transition"
              placeholder="ID Pembayaran, Transaksi, Nama"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter 2: Periode */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Periode</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-xl bg-card text-foreground font-medium focus:outline-none"
              value="01 Okt 2023 - 31 Okt 2023"
              readOnly
            />
          </div>
        </div>

        {/* Filter 3: Metode Pembayaran */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Metode Pembayaran</label>
          <select 
            value={metode} 
            onChange={(e) => setMetode(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-card text-xs font-medium text-foreground focus:outline-none focus:border-emerald-600 appearance-none cursor-pointer"
          >
            <option>Semua Metode</option>
            <option>Transfer Bank</option>
            <option>E-Wallet</option>
            <option>Cash</option>
          </select>
        </div>

        {/* Filter 4: Tombol Aksi & Reset */}
        <div className="md:col-span-2 flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2 px-3 bg-card text-xs font-semibold text-foreground hover:bg-muted transition shadow-xs cursor-pointer">
            <SlidersHorizontal size={14} />
          </button>
          <button 
            onClick={handleResetFilter}
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2 px-3 bg-muted hover:bg-muted/80 text-muted-foreground transition cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>

      </div>

      {/* Tabel Utama */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">ID Pembayaran</th>
                <th className="px-5 py-4">ID Transaksi</th>
                <th className="px-5 py-4">Penyewa</th>
                <th className="px-5 py-4">Metode Bayar</th>
                <th className="px-5 py-4 text-center">Bukti Bayar</th>
                <th className="px-5 py-4 text-right">Jumlah</th>
                <th className="px-5 py-4 text-right">Deposit</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4">Waktu Bayar</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground font-medium">
              {currentItems.map((pmt, index) => (
                <tr key={index} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-4 text-foreground font-bold">{pmt.id_pembayaran}</td>
                  <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="hover:underline cursor-pointer">{pmt.id_transaksi}</span>
                  </td>
                  <td className="px-5 py-4 text-foreground font-semibold">{pmt.penyewa}</td>
                  <td className="px-5 py-4 text-muted-foreground font-normal">{pmt.metode_bayar}</td>
                  
                  {/* Kolom Bukti Bayar */}
                  <td className="px-5 py-4 text-center">
                    {pmt.bukti_bayar === "ada" ? (
                      <button 
                        onClick={() => setPreviewBukti(true)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                      >
                        <ImageIcon size={12} />
                        Lihat Bukti
                      </button>
                    ) : (
                      <span className="text-muted-foreground font-normal">-</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right font-bold text-foreground">{formatHarga(pmt.jumlah)}</td>
                  <td className="px-5 py-4 text-right font-medium text-muted-foreground">{formatHarga(pmt.deposit)}</td>
                  
                  {/* Badge Status */}
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      pmt.status === "Lunas" 
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" 
                        : pmt.status === "Menunggu"
                        ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800"
                        : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800"
                    }`}>
                      {pmt.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground text-xs font-normal">{pmt.waktu_bayar}</td>
                  <td className="px-5 py-4 text-center">
                    <ActionMenu 
                      onViewDetail={() => alert(`Detail item ${pmt.id_pembayaran}`)}
                      onConfirmStatus={() => alert(`Status ${pmt.id_pembayaran} dikonfirmasi`)}
                      onPrint={() => alert(`Mencetak struk invoice ${pmt.id_transaksi}`)}
                    />
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-muted-foreground font-normal">
                    Tidak ada data pembayaran yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <span>
            Showing <strong className="text-foreground">{totalItems === 0 ? 0 : indexOfFirstItem + 1}</strong> to{" "}
            <strong className="text-foreground">{Math.min(indexOfLastItem, totalItems)}</strong> of{" "}
            <strong className="text-foreground">{totalItems}</strong> results
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition bg-card text-foreground flex items-center font-semibold gap-1 px-2.5 cursor-pointer"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            
            {pageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-2 text-muted-foreground">...</span>
              ) : (
                <button
                  key={i}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg border transition ${
                    p === currentPage 
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-inner" 
                      : "border-border bg-card hover:bg-muted text-foreground cursor-pointer"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition bg-card text-foreground flex items-center font-semibold gap-1 px-2.5 cursor-pointer"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>

      </div>

      {/* Bukti Transfer Modal */}
      {previewBukti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-card rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon size={13} className="text-emerald-600" /> Berkas Bukti Transfer
              </span>
              <button onClick={() => setPreviewBukti(false)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg bg-transparent border-none cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 bg-muted/50 flex justify-center items-center">
              <div className="w-48 h-64 bg-card border border-border rounded-xl shadow-xs p-3 text-[9px] text-muted-foreground font-mono flex flex-col justify-between">
                <div className="space-y-1 text-center border-b border-dashed pb-2">
                  <p className="font-bold text-emerald-800 text-xs">M-BANKING SUCCESS</p>
                  <p className="text-muted-foreground">12-10-2023 14:30</p>
                </div>
                <div className="space-y-1 flex-1 pt-2">
                  <div className="flex justify-between"><span>No Ref:</span><span className="font-bold">982310239</span></div>
                  <div className="flex justify-between"><span>Penyewa:</span><span className="font-bold uppercase">BUDI SANTOSO</span></div>
                  <div className="flex justify-between"><span>Tujuan:</span><span className="font-bold">SIPETUALANG</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span>Jumlah:</span>
                    <span className="font-bold text-foreground">Rp 450.000</span>
                  </div>
                </div>
                <div className="text-center text-[7px] text-muted-foreground tracking-wider uppercase pt-1 border-t border-dashed">
                  Valid Receipt
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
