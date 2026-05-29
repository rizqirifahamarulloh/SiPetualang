import { 
  ArrowLeft, Printer, CheckCircle2, Download, 
  Landmark, User, Calendar, Receipt, Info, FileText, Image as ImageIcon, XCircle
} from "lucide-react";

// ─── DATA DUMMY DETAIL PEMBAYARAN ──────────────────────────────
const DUMMY_DETAIL = {
  id_pembayaran: "PAY-2310-001",
  id_transaksi: "TRX-8821A",
  tanggal_bayar: "12 Okt 2023, 14:30 WIB",
  metode: "Transfer Bank - BCA",
  status: "Lunas",
  bukti_bayar_url: "https://via.placeholder.com/400x600?text=Bukti+Transfer+BCA",
  
  penyewa: {
    nama: "Budi Santoso",
    telepon: "+62 812-3456-7890",
    email: "budi.santoso@email.com"
  },
  
  rincian: {
    subtotal_sewa: 450000,
    deposit: 200000,
    pajak: 10000,
    total_tagihan: 660000,
    jumlah_dibayar: 660000,
    kembalian: 0
  }
};

const formatHarga = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

export default function PaymentDetail({ activeId, setActiveId }) {
  // Gunakan data dummy (nanti bisa fetch berdasarkan activeId)
  const data = DUMMY_DETAIL;

  return (
    <div className="space-y-6">
      {/* ─── HEADER NAVIGASI ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveId(null)} 
            className="p-2 rounded-xl hover:bg-gray-100 transition text-foreground border border-border bg-card shadow-sm bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Detail Invoice</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">{data.id_pembayaran}</h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                data.status === "Lunas" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {data.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-xl text-xs font-bold bg-card text-foreground hover:bg-muted transition cursor-pointer">
            <Printer size={15} /> Cetak Struk
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition shadow-sm cursor-pointer">
            <Download size={15} /> Unduh PDF
          </button>
        </div>
      </div>

      {/* ─── GRID KONTEN ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: INFO TRANSAKSI & PENYEWA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Info Pembayaran */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-emerald-700" /> Informasi Pembayaran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Metode Pembayaran</p>
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Landmark size={16} className="text-emerald-600" />
                  {data.metode}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Tanggal & Waktu Bayar</p>
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <Calendar size={16} className="text-emerald-600" />
                  {data.tanggal_bayar}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">ID Transaksi Terkait</p>
                <div className="text-emerald-700 font-black hover:underline cursor-pointer">
                  {data.id_transaksi}
                </div>
              </div>
            </div>
          </div>

          {/* Info Pelanggan */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <User size={18} className="text-emerald-700" /> Data Pengirim / Penyewa
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-lg">
                {data.penyewa.nama.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-foreground">{data.penyewa.nama}</h4>
                <p className="text-xs text-muted-foreground">{data.penyewa.telepon} • {data.penyewa.email}</p>
              </div>
            </div>
          </div>

          {/* Bukti Bayar (Besar) */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-emerald-700" /> Lampiran Bukti Transfer
            </h3>
            <div className="border-2 border-dashed border-border rounded-2xl p-4 flex justify-center bg-muted">
               {/* Simulasi Gambar Bukti Bayar */}
               <div className="bg-card p-4 shadow-xl border border-border rounded-lg max-w-xs w-full text-center space-y-4">
                  <div className="border-b border-dashed pb-2">
                    <p className="text-[10px] font-black text-emerald-700">M-BANKING SUCCESS</p>
                    <p className="text-[8px] text-muted-foreground uppercase">{data.tanggal_bayar}</p>
                  </div>
                  <div className="space-y-1 text-left py-2">
                    <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Ke:</span><span className="font-bold">CAMP-GEAR</span></div>
                    <div className="flex justify-between text-[9px]"><span className="text-muted-foreground">Dari:</span><span className="font-bold uppercase">{data.penyewa.nama}</span></div>
                    <div className="flex justify-between text-[11px] pt-2 border-t border-gray-50">
                      <span className="font-bold">Total:</span>
                      <span className="font-black text-emerald-800">{formatHarga(data.rincian.jumlah_dibayar)}</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-gray-300 italic">--- Valid Digital Receipt ---</div>
               </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: RINGKASAN TAGIHAN */}
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            {/* Dekorasi Background */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-800 rounded-full opacity-50"></div>
            
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-6">Ringkasan Biaya</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-100/70">Subtotal Sewa</span>
                <span className="font-bold">{formatHarga(data.rincian.subtotal_sewa)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-100/70">Deposit Alat</span>
                <span className="font-bold">{formatHarga(data.rincian.deposit)}</span>
              </div>
              <div className="flex justify-between text-sm pb-4 border-b border-emerald-800">
                <span className="text-emerald-100/70">Pajak (PPN)</span>
                <span className="font-bold">{formatHarga(data.rincian.pajak)}</span>
              </div>
              
              <div className="pt-2">
                <p className="text-[10px] text-emerald-300 uppercase font-bold">Total Tagihan</p>
                <p className="text-3xl font-black">{formatHarga(data.rincian.total_tagihan)}</p>
              </div>

              <div className="bg-emerald-800/50 rounded-xl p-3 flex justify-between items-center border border-emerald-700">
                <span className="text-xs text-emerald-200">Jumlah Dibayar</span>
                <span className="text-lg font-bold text-white">{formatHarga(data.rincian.jumlah_dibayar)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-200 font-medium">
                <Info size={14} />
                Status: Pembayaran Terverifikasi
              </div>
            </div>
          </div>

          {/* Tombol Aksi Verifikasi */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
             <button className="w-full py-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-200 transition border-none cursor-pointer">
               <CheckCircle2 size={18} /> Verifikasi Lunas
             </button>
             <button className="w-full py-3 bg-card text-rose-600 border border-rose-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition border-rose-100 cursor-pointer">
               <XCircle size={18} /> Batalkan Pembayaran
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
