import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { transactionService } from '../services/transactionService';
import Navbar from "@/features/customer/components/Navbar";
import Sidebar from "@/features/customer/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Store,
  Loader2,
  Receipt,
  Filter,
  Search,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  History,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/services/api';
import { getStorageUrl } from '@/utils/storageUrl';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────
const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

function getDateSection(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= todayStart) return 'today';
  if (date >= yesterdayStart) return 'yesterday';
  if (date >= weekStart) return 'this_week';
  if (date >= monthStart) return 'this_month';
  return 'older';
}

const SECTION_CONFIG = {
  today:      { label: 'Hari Ini',    icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  yesterday:  { label: 'Kemarin',     icon: Clock,        color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500' },
  this_week:  { label: 'Minggu Ini',  icon: Calendar,     color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200',   dot: 'bg-violet-500' },
  this_month: { label: 'Bulan Ini',   icon: Calendar,     color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500' },
  older:      { label: 'Lebih Lama',  icon: History,      color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200',       dot: 'bg-gray-400' },
};
const SECTION_ORDER = ['today', 'yesterday', 'this_week', 'this_month', 'older'];

const FILTER_TABS = [
  { key: 'all',                  label: 'Semua',              icon: Filter },
  { key: 'menunggu_pembayaran',  label: 'Pending',            icon: Clock },
  { key: 'dibayar',              label: 'Dibayar',            icon: CreditCard },
  { key: 'sedang_disewa',        label: 'Sedang Disewa',      icon: Package },
  { key: 'selesai',              label: 'Selesai',            icon: CheckCircle },
  { key: 'dibatalkan',           label: 'Dibatalkan',         icon: XCircle },
];

const STATUS_COLORS = {
  menunggu_pembayaran: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  dibayar:             'bg-blue-100 text-blue-800 border-blue-200',
  sedang_disewa:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  selesai:             'bg-gray-100 text-gray-700 border-gray-200',
  dibatalkan:          'bg-red-100 text-red-700 border-red-200',
};
const STATUS_LABELS = {
  menunggu_pembayaran: 'Menunggu Pembayaran',
  dibayar:             'Dibayar',
  sedang_disewa:       'Sedang Disewa',
  selesai:             'Selesai',
  dibatalkan:          'Dibatalkan',
};

const PAYMENT_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sukses:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  gagal:   'bg-red-50 text-red-700 border-red-200',
};

// ─── Component ────────────────────────────────────
export default function TransaksiPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionService.getTransaksiSebagaiPenyewa();
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  // ── Derived data ──
  const { grouped, totalFiltered } = useMemo(() => {
    let filtered = transactions
      .filter((t) => filter === 'all' || t.status_sewa === filter)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.nama_barang?.toLowerCase().includes(q) ||
          t.midtrans_order_id?.toLowerCase().includes(q) ||
          String(t.id_transaksi).includes(q)
        );
      });

    filtered.sort((a, b) => {
      const dA = new Date(a.created_at).getTime();
      const dB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dB - dA : dA - dB;
    });

    const groups = {};
    filtered.forEach((t) => {
      const key = getDateSection(t.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return { grouped: groups, totalFiltered: filtered.length };
  }, [transactions, filter, searchQuery, sortOrder]);

  const stats = useMemo(() => ({
    total: transactions.length,
    pending: transactions.filter((t) => t.status_sewa === 'menunggu_pembayaran').length,
    aktif: transactions.filter((t) => t.status_sewa === 'sedang_disewa').length,
    selesai: transactions.filter((t) => t.status_sewa === 'selesai').length,
  }), [transactions]);

  // ── Payment handler ──
  const handlePayment = async (trans) => {
    setProcessingId(trans.id_transaksi);
    try {
      let snapToken = trans.snap_token;
      if (!snapToken) {
        const response = await axios.post(
          `${API_URL}/customer/transaksi/${trans.id_transaksi}/refresh-payment`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        snapToken = response.data.snap_token;
      }
      if (!window.snap) {
        const script = document.createElement('script');
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', 'SB-Mid-client-xxxxx');
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; setTimeout(resolve, 2000); });
      }
      if (!window.snap || typeof window.snap.pay !== 'function') throw new Error('Midtrans Snap tidak tersedia.');
      window.snap.pay(snapToken, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); fetchTransactions(); },
        onPending: () => { toast.info('Pembayaran pending'); fetchTransactions(); },
        onError: (result) => { toast.error('Pembayaran gagal: ' + (result.status_message || 'Unknown')); setProcessingId(null); },
        onClose: () => { setProcessingId(null); },
      });
    } catch (err) {
      toast.error('Gagal: ' + (err.response?.data?.message || err.message));
      setProcessingId(null);
    }
  };

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);
  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

  if (!user) return null;

  // ── Render card ──
  const renderCard = (trans) => (
    <Card key={trans.id_transaksi} className="hover:shadow-sm transition-shadow overflow-hidden">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">{trans.nama_barang}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              #{trans.midtrans_order_id || trans.id_transaksi}
              <span className="mx-1.5">·</span>
              {new Date(trans.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`text-[9px] font-bold border ${STATUS_COLORS[trans.status_sewa] || ''}`}>
              {STATUS_LABELS[trans.status_sewa] || trans.status_sewa}
            </Badge>
            <Badge className={`text-[9px] font-bold border ${PAYMENT_COLORS[trans.status_pembayaran] || ''}`}>
              {trans.status_pembayaran === 'sukses' ? 'Lunas' : trans.status_pembayaran === 'pending' ? 'Belum Bayar' : trans.status_pembayaran}
            </Badge>
          </div>
        </div>

        {/* Multi-item list */}
        {trans.detail_transaksi && trans.detail_transaksi.length > 0 && (
          <div className="mb-2.5 bg-muted/50 rounded-xl p-2.5 space-y-1 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              {trans.detail_transaksi.length} Barang
            </p>
            {trans.detail_transaksi.map((detail, idx) => (
              <div key={detail.id_detail || idx} className="flex items-center gap-2 bg-card rounded-lg p-2 border text-xs">
                {detail.barang?.foto_barang ? (
                  <img src={getStorageUrl(detail.barang.foto_barang)} alt="" className="w-8 h-8 rounded-lg object-cover border shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{detail.nama_barang || detail.barang?.nama_barang}</p>
                  <p className="text-muted-foreground text-[10px]">{detail.jumlah_pinjam} unit × {formatRupiah(detail.harga_per_hari || detail.barang?.harga_sewa)}/hari</p>
                </div>
                <p className="font-bold shrink-0">{formatRupiah(detail.subtotal)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>{trans.tanggal_mulai} – {trans.tanggal_selesai} ({trans.total_hari}h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Store className="w-3 h-3" />
            <span>{trans.pemilik?.nama || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {trans.metode_pengiriman === 'pickup' ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
            <span>{trans.metode_pengiriman === 'pickup' ? 'Ambil Sendiri' : 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" />
            <span className="font-bold text-foreground">{formatRupiah(trans.total_biaya)}</span>
          </div>
          {trans.metode_pengiriman === 'delivery' && trans.biaya_pengiriman > 0 && (
            <div className="flex items-center gap-1.5">
              <Truck className="w-3 h-3" />
              <span>Ongkir: {formatRupiah(trans.biaya_pengiriman)}</span>
            </div>
          )}
          {Number(trans.nominal_deposit) > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-100 text-emerald-800 text-[7px] flex items-center justify-center rounded font-bold">D</span>
              <span>Deposit: {formatRupiah(trans.nominal_deposit)}</span>
            </div>
          )}
          {trans.alamat_pengiriman && (
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{trans.alamat_pengiriman}</span>
            </div>
          )}
        </div>

        {/* Pay Button */}
        {trans.status_sewa === 'menunggu_pembayaran' && (
          <div className="mt-3 pt-3 border-t">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs gap-2"
              onClick={() => handlePayment(trans)}
              disabled={processingId === trans.id_transaksi}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {processingId === trans.id_transaksi ? 'Memproses...' : 'Bayar Sekarang'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3">
            <Sidebar user={user} isKtpVerified={user?.is_verified} getPhotoUrl={getPhotoUrl} getInitials={getInitials} />
          </div>

          <div className="md:col-span-8 lg:col-span-9 space-y-5">
            {/* Header Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Riwayat Transaksi</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Semua transaksi penyewaan Anda</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total',   value: stats.total,   color: 'text-foreground',  bg: 'bg-muted/50' },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-700',  bg: 'bg-yellow-50' },
                    { label: 'Aktif',   value: stats.aktif,   color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Selesai', value: stats.selesai, color: 'text-gray-600',    bg: 'bg-gray-50' },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2.5 text-center`}>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</p>
                      <p className={`text-xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama barang, ID transaksi..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  />
                </div>

                {/* Toolbar: Filters + Sort */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {FILTER_TABS.map((tab) => {
                      const TabIcon = tab.icon;
                      const count = tab.key === 'all' ? transactions.length : transactions.filter((t) => t.status_sewa === tab.key).length;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setFilter(tab.key)}
                          className={`px-2.5 py-1.5 text-[10px] font-bold rounded-full transition-all border whitespace-nowrap flex items-center gap-1 ${
                            filter === tab.key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground hover:bg-muted border-border'
                          }`}
                        >
                          <TabIcon className="w-3 h-3" />
                          {tab.label}
                          <span className={`text-[8px] px-1 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border bg-background text-muted-foreground hover:bg-muted transition-all shrink-0"
                  >
                    {sortOrder === 'newest' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                    {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Sections */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Memuat transaksi...</span>
              </div>
            ) : totalFiltered === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Tidak ada transaksi</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {filter !== 'all' ? 'Tidak ada transaksi dengan filter ini' : searchQuery ? 'Coba kata kunci lain' : 'Mulai sewa peralatan outdoor!'}
                  </p>
                  {filter === 'all' && !searchQuery && (
                    <Link to="/sewa-alat">
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">Mulai Rental</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {(sortOrder === 'newest' ? SECTION_ORDER : [...SECTION_ORDER].reverse()).map((sectionKey) => {
                  const items = grouped[sectionKey];
                  if (!items || items.length === 0) return null;
                  const cfg = SECTION_CONFIG[sectionKey];
                  const SectionIcon = cfg.icon;

                  return (
                    <div key={sectionKey}>
                      {/* Section Header */}
                      <div className={`flex items-center gap-2.5 mb-3 px-3 py-2 rounded-xl border ${cfg.bg}`}>
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <SectionIcon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground font-medium ml-auto">{items.length} transaksi</span>
                      </div>

                      {/* Section Items */}
                      <div className="space-y-3 ml-1">
                        {items.map(renderCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
