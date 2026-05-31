import { useState, useEffect } from "react";
import { 
  Search, Download, Eye, RefreshCw, 
  CreditCard, DollarSign, CheckCircle2, AlertCircle,
  Calendar, SlidersHorizontal, X, Loader2, Package, Clock
} from "lucide-react";
import { adminService } from "../services/adminService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TablePagination, { paginateArray } from "@/components/TablePagination";

const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

const STATUS_CONFIG = {
  sukses:  { label: 'Lunas',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' },
  pending: { label: 'Menunggu',    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800' },
  gagal:   { label: 'Gagal',       cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800' },
};

const SEWA_CONFIG = {
  menunggu_pembayaran: { label: 'Menunggu Bayar', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  dibayar:             { label: 'Dibayar',        cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  sedang_disewa:       { label: 'Disewa',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  selesai:             { label: 'Selesai',        cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  dibatalkan:          { label: 'Dibatalkan',     cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function Payment() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const PER_PAGE = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllTransactions();
      const data = response.data || response || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const filteredData = transactions.filter((t) => {
    const matchSearch = 
      (t.midtrans_order_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.nama_barang || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.penyewa?.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      String(t.id_transaksi).includes(search);

    const matchStatus = statusFilter === "semua" || t.status_pembayaran === statusFilter;

    return matchSearch && matchStatus;
  });

  // Stats
  const totalPembayaran = transactions.reduce((sum, t) => sum + Number(t.total_biaya || 0), 0);
  const lunas = transactions.filter(t => t.status_pembayaran === 'sukses').length;
  const pending = transactions.filter(t => t.status_pembayaran === 'pending').length;
  const gagal = transactions.filter(t => t.status_pembayaran === 'gagal').length;

  const handleResetFilter = () => {
    setSearch("");
    setStatusFilter("semua");
  };

  // ── Detail Modal ──
  if (selectedTrx) {
    return <PaymentDetail trx={selectedTrx} onBack={() => setSelectedTrx(null)} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Dashboard &gt; Pembayaran</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Pembayaran</h1>
        </div>
        <button onClick={fetchData} className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-xl text-xs font-semibold bg-card text-foreground hover:bg-muted transition shadow-xs cursor-pointer">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-medium text-muted-foreground">Total Pendapatan</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
            </div>
            <p className="text-2xl font-bold">{formatRupiah(totalPembayaran)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-medium text-muted-foreground">Lunas</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg"><CheckCircle2 size={16} /></div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{lunas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-medium text-muted-foreground">Menunggu</p>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg"><Clock size={16} /></div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-medium text-muted-foreground">Gagal</p>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg"><AlertCircle size={16} /></div>
            </div>
            <p className="text-2xl font-bold text-rose-600">{gagal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Cari Transaksi</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-xl bg-card text-foreground focus:outline-none focus:border-emerald-600 transition"
              placeholder="Cari ID, nama barang, atau penyewa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Status Pembayaran</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-card text-xs font-medium text-foreground focus:outline-none focus:border-emerald-600 appearance-none cursor-pointer"
          >
            <option value="semua">Semua Status</option>
            <option value="sukses">Lunas</option>
            <option value="pending">Menunggu</option>
            <option value="gagal">Gagal</option>
          </select>
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <button onClick={handleResetFilter}
            className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2 px-3 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold transition cursor-pointer">
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
            <span className="text-sm text-muted-foreground">Memuat data pembayaran...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Tidak ada data pembayaran</p>
            <p className="text-xs mt-1">Coba ubah filter atau keyword pencarian</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">No</th>
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Penyewa</th>
                    <th className="px-5 py-4">Barang</th>
                    <th className="px-5 py-4 text-right">Total Biaya</th>
                    <th className="px-5 py-4 text-right">Deposit</th>
                    <th className="px-5 py-4 text-center">Status Bayar</th>
                    <th className="px-5 py-4 text-center">Status Sewa</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground font-medium">
                  {paginateArray(filteredData, currentPage, PER_PAGE).map((trx, index) => {
                    const payCfg = STATUS_CONFIG[trx.status_pembayaran] || STATUS_CONFIG.pending;
                    const sewaCfg = SEWA_CONFIG[trx.status_sewa] || { label: trx.status_sewa, cls: '' };
                    return (
                      <tr key={trx.id_transaksi} className="hover:bg-muted/30 transition">
                        <td className="px-5 py-4 text-muted-foreground">{(currentPage - 1) * PER_PAGE + index + 1}</td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          {trx.midtrans_order_id || `TRX-${trx.id_transaksi}`}
                        </td>
                        <td className="px-5 py-4 font-semibold">{trx.penyewa?.nama || '-'}</td>
                        <td className="px-5 py-4 text-muted-foreground max-w-[180px] truncate">{trx.nama_barang}</td>
                        <td className="px-5 py-4 text-right font-bold">{formatRupiah(trx.total_biaya)}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground">{formatRupiah(trx.nominal_deposit)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${payCfg.cls}`}>
                            {payCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${sewaCfg.cls}`}>
                            {sewaCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground text-xs">{formatDate(trx.created_at)}</td>
                        <td className="px-5 py-4 text-center">
                          <button 
                            onClick={() => setSelectedTrx(trx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                          >
                            <Eye size={12} /> Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredData.length}
              perPage={PER_PAGE}
              onPageChange={setCurrentPage}
              label="pembayaran"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Payment Detail Sub-component ───────────────────
function PaymentDetail({ trx, onBack }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const payCfg = STATUS_CONFIG[trx.status_pembayaran] || STATUS_CONFIG.pending;
  const biayaSewa = Number(trx.total_biaya || 0) - Number(trx.nominal_deposit || 0) - Number(trx.biaya_pengiriman || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted transition text-foreground cursor-pointer">
            <X size={20} />
          </button>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Detail Pembayaran</p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">{trx.midtrans_order_id || `TRX-${trx.id_transaksi}`}</h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${payCfg.cls}`}>
                {payCfg.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Pembayaran */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-700" /> Informasi Pembayaran
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoField label="Metode Pembayaran" value="Midtrans (Online)" icon={<CreditCard size={14} className="text-emerald-600" />} />
              <InfoField label="Tanggal Transaksi" value={formatDate(trx.created_at)} icon={<Calendar size={14} className="text-emerald-600" />} />
              <InfoField label="Status Pembayaran" value={payCfg.label} highlight={trx.status_pembayaran === 'sukses' ? 'emerald' : trx.status_pembayaran === 'gagal' ? 'red' : 'amber'} />
              <InfoField label="Metode Pengiriman" value={trx.metode_pengiriman === 'pickup' ? 'Ambil di Tempat' : 'Delivery'} />
            </div>
          </div>

          {/* Info Penyewa */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Package size={18} className="text-emerald-700" /> Data Penyewa & Barang
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoField label="Nama Penyewa" value={trx.penyewa?.nama || '-'} />
              <InfoField label="Email" value={trx.penyewa?.email || '-'} />
              <InfoField label="Nama Barang" value={trx.nama_barang || '-'} />
              <InfoField label="Jumlah" value={`${trx.jumlah || '-'} unit × ${trx.total_hari || '-'} hari`} />
              <InfoField label="Periode Sewa" value={`${trx.tanggal_mulai || '-'} s/d ${trx.tanggal_selesai || '-'}`} />
              <InfoField label="Pemilik" value={trx.pemilik?.nama || '-'} />
            </div>
            {trx.alamat_pengiriman && (
              <div className="mt-3 bg-muted/50 p-3 rounded-xl text-xs">
                <span className="font-bold text-muted-foreground">Alamat: </span>{trx.alamat_pengiriman}
              </div>
            )}
          </div>

          {/* Detail barang */}
          {trx.detail_transaksi?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-4">Daftar Barang ({trx.detail_transaksi.length})</h3>
              <div className="space-y-2">
                {trx.detail_transaksi.map((d, idx) => (
                  <div key={d.id_detail || idx} className="flex items-center justify-between bg-muted/30 rounded-xl p-3 border text-xs">
                    <div>
                      <p className="font-semibold">{d.nama_barang || d.barang?.nama_barang}</p>
                      <p className="text-muted-foreground">{d.jumlah_pinjam} unit × {formatRupiah(d.harga_per_hari)}/hari</p>
                    </div>
                    <p className="font-bold">{formatRupiah(d.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-800 rounded-full opacity-50"></div>
            
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-6">Ringkasan Biaya</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-100/70">Biaya Sewa</span>
                <span className="font-bold">{formatRupiah(biayaSewa > 0 ? biayaSewa : trx.total_biaya)}</span>
              </div>
              {Number(trx.nominal_deposit) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-100/70">Deposit</span>
                  <span className="font-bold">{formatRupiah(trx.nominal_deposit)}</span>
                </div>
              )}
              {Number(trx.biaya_pengiriman) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-100/70">Ongkir</span>
                  <span className="font-bold">{formatRupiah(trx.biaya_pengiriman)}</span>
                </div>
              )}
              {Number(trx.fee_admin) > 0 && (
                <div className="flex justify-between text-sm pb-4 border-b border-emerald-800">
                  <span className="text-emerald-100/70">Fee Admin (20%)</span>
                  <span className="font-bold">{formatRupiah(trx.fee_admin)}</span>
                </div>
              )}
              
              <div className="pt-2">
                <p className="text-[10px] text-emerald-300 uppercase font-bold">Total Tagihan</p>
                <p className="text-3xl font-black">{formatRupiah(trx.total_biaya)}</p>
              </div>

              <div className={`rounded-xl p-3 flex justify-between items-center border ${trx.status_pembayaran === 'sukses' ? 'bg-emerald-800/50 border-emerald-700' : 'bg-amber-800/30 border-amber-700'}`}>
                <span className="text-xs text-emerald-200">Status</span>
                <span className="text-sm font-bold">{payCfg.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, icon, highlight }) {
  const colorMap = { emerald: 'text-emerald-600 font-bold', red: 'text-red-600 font-bold', amber: 'text-amber-600 font-bold' };
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className={`flex items-center gap-2 font-bold text-sm ${highlight ? colorMap[highlight] : 'text-foreground'}`}>
        {icon}{value}
      </div>
    </div>
  );
}
