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
  User,
  X,
  Loader2,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  ShoppingBag,
  History,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/services/api';
import { getStorageUrl } from '@/utils/storageUrl';
import { toast } from 'sonner';

const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

// Section grouping helpers
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
  today: { label: 'Hari Ini', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  yesterday: { label: 'Kemarin', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  this_week: { label: 'Minggu Ini', icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  this_month: { label: 'Bulan Ini', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  older: { label: 'Lebih Lama', icon: History, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
};

const SECTION_ORDER = ['today', 'yesterday', 'this_week', 'this_month', 'older'];

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rentalFilter, setRentalFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // newest | oldest

  const token = localStorage.getItem('token');

  // Return Gear States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnTrx, setSelectedReturnTrx] = useState(null);
  const [returnForm, setReturnForm] = useState({
    metode_kembali: 'pickup',
    no_resi_kembali: ''
  });
  const [submittingReturn, setSubmittingReturn] = useState(false);

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

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Compute filtered, sorted, and grouped data
  const { grouped, totalFiltered } = useMemo(() => {
    // Only show rental-relevant statuses
    let filtered = transactions.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'selesai' || t.status_sewa === 'dibayar');
    if (rentalFilter === 'aktif') filtered = filtered.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'dibayar');
    else if (rentalFilter === 'selesai') filtered = filtered.filter(t => t.status_sewa === 'selesai');

    // Sort
    filtered.sort((a, b) => {
      const dA = new Date(a.created_at).getTime();
      const dB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dB - dA : dA - dB;
    });

    // Group by section
    const groups = {};
    filtered.forEach((t) => {
      // Use tanggal_mulai for "active" grouping context, created_at for general
      const key = getDateSection(t.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return { grouped: groups, totalFiltered: filtered.length };
  }, [transactions, rentalFilter, sortOrder]);

  const stats = useMemo(() => ({
    total: transactions.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'selesai' || t.status_sewa === 'dibayar').length,
    aktif: transactions.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'dibayar').length,
    selesai: transactions.filter(t => t.status_sewa === 'selesai').length,
  }), [transactions]);

  const openReturnModal = (trx) => {
    setSelectedReturnTrx(trx);
    setReturnForm({ metode_kembali: 'pickup', no_resi_kembali: '' });
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReturn(true);
    try {
      await transactionService.kembalikanBarang(selectedReturnTrx.id_transaksi, returnForm);
      toast.success('Pengajuan pengembalian berhasil diajukan ke Admin!');
      setIsReturnModalOpen(false);
      setSelectedReturnTrx(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || 'Gagal mengajukan pengembalian');
    } finally {
      setSubmittingReturn(false);
    }
  };

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
      if (!window.snap || typeof window.snap.pay !== 'function') {
        throw new Error('Midtrans Snap tidak tersedia. Silakan refresh halaman.');
      }
      window.snap.pay(snapToken, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); window.location.href = '/customer/transactions'; },
        onPending: () => { toast.info('Pembayaran pending'); window.location.href = '/customer/transactions'; },
        onError: (result) => { toast.error('Pembayaran gagal: ' + (result.status_message || 'Unknown error')); setProcessingId(null); },
        onClose: () => { setProcessingId(null); },
      });
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Gagal memuat pembayaran: ' + (err.response?.data?.message || err.message));
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      menunggu_pembayaran: { label: 'Menunggu Pembayaran', icon: Clock, cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      dibayar: { label: 'Dibayar', icon: CreditCard, cls: 'bg-blue-100 text-blue-800 border-blue-200' },
      sedang_disewa: { label: 'Sedang Disewa', icon: Package, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      selesai: { label: 'Selesai', icon: CheckCircle, cls: 'bg-gray-100 text-gray-700 border-gray-200' },
      dibatalkan: { label: 'Dibatalkan', icon: XCircle, cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const cfg = map[status] || { label: status, icon: Clock, cls: '' };
    const Icon = cfg.icon;
    return <Badge className={`text-[9px] font-bold border ${cfg.cls}`}><Icon className="w-2.5 h-2.5 mr-0.5" />{cfg.label}</Badge>;
  };

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);
  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

  if (!user) return null;

  // Render a single transaction card
  const renderCard = (trans) => (
    <div key={trans.id_transaksi} className="border rounded-xl p-5 hover:shadow-sm transition-shadow bg-card">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">{trans.nama_barang}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            #{trans.midtrans_order_id || trans.id_transaksi}
            <span className="mx-1">·</span>
            {new Date(trans.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {getStatusBadge(trans.status_sewa)}
        </div>
      </div>

      {/* Multi-item details */}
      {trans.detail_transaksi && trans.detail_transaksi.length > 0 && (
        <div className="mb-3 bg-muted/50 rounded-xl p-3 space-y-1.5 border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Barang ({trans.detail_transaksi.length} item)</p>
          {trans.detail_transaksi.map((detail, idx) => (
            <div key={detail.id_detail || idx} className="flex items-center gap-3 bg-card rounded-lg p-2 border border-border">
              {detail.barang?.foto_barang ? (
                <img src={getStorageUrl(detail.barang.foto_barang)} alt={detail.nama_barang || detail.barang?.nama_barang} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{detail.nama_barang || detail.barang?.nama_barang}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.jumlah_pinjam} unit × Rp {Number(detail.harga_per_hari || detail.barang?.harga_sewa || 0).toLocaleString()}/hari
                  {detail.barang?.pemilik && (<span className="text-muted-foreground"> — {detail.barang.pemilik.nama}</span>)}
                </p>
              </div>
              <p className="text-xs font-bold text-foreground shrink-0">Rp {Number(detail.subtotal).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{trans.tanggal_mulai} - {trans.tanggal_selesai} <span className="text-muted-foreground">({trans.total_hari} hari)</span></span>
          </div>
          {(!trans.detail_transaksi || trans.detail_transaksi.length === 0) && (
            <div className="flex items-center gap-2 text-xs">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span>{trans.jumlah} × Rp {Number(trans.harga_per_hari).toLocaleString()}/hari</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <Store className="w-3.5 h-3.5 text-gray-400" />
            <span>Pemilik: {trans.pemilik?.nama || 'Tidak diketahui'}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            {trans.metode_pengiriman === 'pickup' ? <Store className="w-3.5 h-3.5 text-gray-400" /> : <Truck className="w-3.5 h-3.5 text-gray-400" />}
            <span>{trans.metode_pengiriman === 'pickup' ? 'Ambil di Tempat' : 'Kirim ke Alamat'}</span>
          </div>
          {trans.metode_pengiriman === 'delivery' && trans.biaya_pengiriman > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              <span>Ongkir: <span className="font-semibold text-emerald-600">{formatRupiah(trans.biaya_pengiriman)}</span></span>
            </div>
          )}
          {trans.alamat_pengiriman && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{trans.alamat_pengiriman}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span>Total: <span className="font-bold text-emerald-600">{formatRupiah(trans.total_biaya)}</span></span>
          </div>
          {Number(trans.nominal_deposit) > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-3.5 bg-emerald-100 text-emerald-800 text-[8px] flex items-center justify-center rounded font-bold">D</span>
              <span>Deposit: {formatRupiah(trans.nominal_deposit)} <span className="text-[10px] text-muted-foreground">(Refundable)</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Completed rental info */}
      {trans.status_sewa === 'selesai' && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-4 border border-emerald-500/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <CheckCircle className="size-3.5" /> Informasi Pengembalian Barang
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><p className="text-muted-foreground font-semibold mb-0.5">Nama Barang</p><p className="font-bold">{trans.nama_barang}</p></div>
              <div><p className="text-muted-foreground font-semibold mb-0.5">Total Barang</p><p className="font-bold">{trans.jumlah} Unit</p></div>
              <div><p className="text-muted-foreground font-semibold mb-0.5">Hari Pengembalian</p><p className="font-bold">{trans.tanggal_kembali_real || trans.pengembalian?.tanggal_kembali || '-'}</p></div>
              <div>
                <p className="text-muted-foreground font-semibold mb-0.5">Status</p>
                {trans.pengembalian?.status_pengembalian === 'terlambat' ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Terlambat</span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Tepat Waktu</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Denda Keterlambatan</h5>
              <p className="text-xs text-muted-foreground">Denda <span className="font-bold text-foreground">Rp {Number(trans.pengembalian?.denda_per_hari || 20000).toLocaleString()}</span> per hari per unit.</p>
              {trans.pengembalian?.catatan && (<p className="text-[11px] italic text-amber-600 font-semibold mt-1">Catatan: "{trans.pengembalian.catatan}"</p>)}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Denda</p>
              {Number(trans.pengembalian?.total_denda || 0) > 0 ? (
                <p className="text-lg font-black text-red-600">{formatRupiah(trans.pengembalian.total_denda)}</p>
              ) : (
                <p className="text-sm font-bold text-emerald-600">Rp 0 (Bebas Denda)</p>
              )}
            </div>
          </div>

          {Number(trans.nominal_deposit) > 0 && (
            <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100 space-y-3">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Rincian Deposit & Denda</h5>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-card p-3 rounded-xl border"><p className="text-muted-foreground font-semibold mb-0.5">Deposit Awal</p><p className="font-bold">{formatRupiah(trans.nominal_deposit)}</p></div>
                <div className="bg-card p-3 rounded-xl border"><p className="text-muted-foreground font-semibold mb-0.5">Denda Kerusakan</p><p className={`font-bold ${Number(trans.pengembalian?.denda_kerusakan || 0) > 0 ? 'text-red-600' : ''}`}>{formatRupiah(trans.pengembalian?.denda_kerusakan || 0)}</p></div>
                <div className="bg-card p-3 rounded-xl border"><p className="text-muted-foreground font-semibold mb-0.5">Denda Terlambat</p><p className={`font-bold ${Number(trans.pengembalian?.total_denda || 0) > 0 ? 'text-red-600' : ''}`}>{formatRupiah(trans.pengembalian?.total_denda || 0)}</p></div>
              </div>
              <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-xs">
                  <span className="font-bold text-emerald-800 block">Sisa Deposit Refund</span>
                  <span className="text-[10px] text-muted-foreground">* Dikembalikan ke Penyewa</span>
                </div>
                <span className="text-lg font-black text-emerald-600 shrink-0">
                  {formatRupiah(Math.max(0, Number(trans.nominal_deposit) - Number(trans.pengembalian?.denda_kerusakan || 0) - Number(trans.pengembalian?.total_denda || 0)))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Return button */}
      {trans.status_sewa === 'sedang_disewa' && trans.status_kembali === 'belum' && (
        <div className="mt-4">
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-1.5 h-10 rounded-xl" onClick={() => openReturnModal(trans)}>
            <RotateCcw className="w-4 h-4" /> Kembalikan Barang
          </Button>
        </div>
      )}

      {/* Returning banner */}
      {trans.status_sewa === 'sedang_disewa' && trans.status_kembali === 'proses' && (
        <div className="mt-4 bg-amber-50/50 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-800">Barang Sedang Dikembalikan</p>
            <p className="text-muted-foreground">
              <span className="font-medium">Metode:</span> {trans.metode_kembali === 'delivery' ? 'Kirim via Kurir' : 'Datang Langsung'}
            </p>
            {trans.no_resi_kembali && (
              <p className="text-muted-foreground font-mono"><span className="font-medium font-sans">Resi:</span> {trans.no_resi_kembali}</p>
            )}
            <p className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded w-fit mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> Menunggu Verifikasi Admin
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Sidebar user={user} getPhotoUrl={getPhotoUrl} getInitials={getInitials} />

          <div className="lg:col-span-3 space-y-5">
            <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Penyewaan Saya</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Riwayat barang yang Anda sewa — aktif maupun selesai</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Toolbar: Filter + Sort */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Filter Tabs */}
                  <div className="flex gap-1.5">
                    {[
                      { key: 'all', label: 'Semua', count: stats.total },
                      { key: 'aktif', label: 'Aktif', count: stats.aktif },
                      { key: 'selesai', label: 'Selesai', count: stats.selesai },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setRentalFilter(tab.key)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all border flex items-center gap-1 ${
                          rentalFilter === tab.key
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-background text-muted-foreground hover:bg-muted border-border'
                        }`}
                      >
                        {tab.label}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rentalFilter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sort By */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border bg-background text-muted-foreground hover:bg-muted transition-all"
                  >
                    {sortOrder === 'newest' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                    {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                  </button>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
                    <span className="text-sm text-muted-foreground">Memuat penyewaan...</span>
                  </div>
                ) : totalFiltered === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-700">Belum ada penyewaan{rentalFilter !== 'all' ? ` yang ${rentalFilter}` : ''}</h3>
                    <p className="text-xs text-gray-400 mt-1">Barang yang Anda sewa akan tampil di sini</p>
                    <Link to="/sewa-alat">
                      <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white" size="sm">Mulai Rental</Button>
                    </Link>
                  </div>
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
                            <span className="text-[10px] text-muted-foreground font-medium ml-auto">{items.length} item</span>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Pengembalian Barang */}
      {isReturnModalOpen && selectedReturnTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="size-5 text-amber-600" />
                Kembalikan Barang Sewaan
              </h2>
              <button onClick={() => { setIsReturnModalOpen(false); setSelectedReturnTrx(null); }} className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-xs space-y-1 text-amber-800 dark:text-amber-400">
                <p><strong>Peralatan:</strong> {selectedReturnTrx.nama_barang} ({selectedReturnTrx.jumlah} unit)</p>
                <p><strong>Batas Waktu:</strong> {selectedReturnTrx.tanggal_selesai}</p>
                <p className="text-[10px] mt-1 text-amber-700 italic">* Keterlambatan pengembalian dikenakan denda Rp 20.000 per hari.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Metode Pengembalian</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setReturnForm(prev => ({ ...prev, metode_kembali: "pickup" }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${returnForm.metode_kembali === "pickup" ? "border-amber-500 bg-amber-50/50 text-amber-700 font-bold" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                    <Store className="size-4" /> Datang Langsung
                  </button>
                  <button type="button" onClick={() => setReturnForm(prev => ({ ...prev, metode_kembali: "delivery" }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${returnForm.metode_kembali === "delivery" ? "border-amber-500 bg-amber-50/50 text-amber-700 font-bold" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                    <Truck className="size-4" /> Kirim Delivery
                  </button>
                </div>
              </div>

              {returnForm.metode_kembali === "delivery" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nomor Resi / Kurir</label>
                  <input type="text" placeholder="Masukkan nama kurir & nomor resi" value={returnForm.no_resi_kembali}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, no_resi_kembali: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500 bg-card" required />
                  <p className="text-[10px] text-muted-foreground mt-1">Kirimkan barang ke Gudang SiPetualang.</p>
                </div>
              )}

              {returnForm.metode_kembali === "pickup" && (
                <div className="bg-muted/50 p-3 rounded-xl text-[11px] text-muted-foreground border border-dashed">
                  Silakan kembalikan barang ke petugas loket Gudang Utama SiPetualang sebelum batas waktu.
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => { setIsReturnModalOpen(false); setSelectedReturnTrx(null); }} className="rounded-xl">Batal</Button>
                <Button type="submit" disabled={submittingReturn} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                  {submittingReturn ? "Mengirim..." : "Konfirmasi Pengembalian"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}