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
  RotateCcw,
  ArrowDown,
  ArrowUp,
  ShoppingBag,
  History,
  CalendarDays,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/services/api';
import { getStorageUrl } from '@/utils/storageUrl';
import { toast } from 'sonner';

const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatDateTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

// ── Status configs ──
const STATUS_CONFIG = {
  dibayar:        { label: 'Dibayar',        icon: CreditCard, cls: 'bg-blue-100 text-blue-700 border-blue-200',        dot: 'bg-blue-500' },
  sedang_disewa:  { label: 'Sedang Disewa',  icon: Package,    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  selesai:        { label: 'Selesai',        icon: CheckCircle,cls: 'bg-gray-100 text-gray-600 border-gray-200',         dot: 'bg-gray-400' },
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rentalFilter, setRentalFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Return modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnTrx, setSelectedReturnTrx] = useState(null);
  const [returnForm, setReturnForm] = useState({ metode_kembali: 'pickup', no_resi_kembali: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

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

  // ── Filtered & sorted
  const filteredData = useMemo(() => {
    let list = transactions.filter(t => ['sedang_disewa', 'selesai', 'dibayar'].includes(t.status_sewa));
    if (rentalFilter === 'aktif') list = list.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'dibayar');
    else if (rentalFilter === 'selesai') list = list.filter(t => t.status_sewa === 'selesai');
    list.sort((a, b) => {
      const dA = new Date(a.created_at).getTime();
      const dB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dB - dA : dA - dB;
    });
    return list;
  }, [transactions, rentalFilter, sortOrder]);

  const stats = useMemo(() => ({
    total: transactions.filter(t => ['sedang_disewa', 'selesai', 'dibayar'].includes(t.status_sewa)).length,
    aktif: transactions.filter(t => t.status_sewa === 'sedang_disewa' || t.status_sewa === 'dibayar').length,
    selesai: transactions.filter(t => t.status_sewa === 'selesai').length,
  }), [transactions]);

  // ── Handlers
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
      toast.success('Pengajuan pengembalian berhasil!');
      setIsReturnModalOpen(false);
      setSelectedReturnTrx(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengajukan pengembalian');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);
  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';
  if (!user) return null;

  // ── Render single card
  const renderCard = (trans) => {
    const cfg = STATUS_CONFIG[trans.status_sewa] || STATUS_CONFIG.selesai;
    const Icon = cfg.icon;
    const sisaDeposit = Math.max(0, Number(trans.nominal_deposit || 0) - Number(trans.pengembalian?.denda_kerusakan || 0) - Number(trans.pengembalian?.total_denda || 0));

    return (
      <div key={trans.id_transaksi} className="border rounded-xl md:rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
        {/* ─ Card Header ─ */}
        <div className="flex items-center justify-between gap-2 md:gap-3 px-3 md:px-5 py-2.5 md:py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">{trans.nama_barang}</h3>
              <p className="text-[11px] text-muted-foreground">
                #{trans.midtrans_order_id || trans.id_transaksi}
                <span className="mx-1">·</span>
                {formatDate(trans.created_at)}
              </p>
            </div>
          </div>
          <Badge className={`text-[9px] font-bold border shrink-0 ${cfg.cls}`}>
            <Icon className="w-2.5 h-2.5 mr-0.5" />{cfg.label}
          </Badge>
        </div>

        {/* ─ Card Body ─ */}
        <div className="p-3 md:p-5 space-y-3 md:space-y-4">

          {/* Daftar Barang */}
          {trans.detail_transaksi?.length > 0 && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Daftar Barang ({trans.detail_transaksi.length} item)
              </p>
              {trans.detail_transaksi.map((d, idx) => (
                <div key={d.id_detail || idx} className="flex items-center gap-3 bg-card rounded-lg p-2 border">
                  {d.barang?.foto_barang ? (
                    <img src={getStorageUrl(d.barang.foto_barang)} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{d.nama_barang || d.barang?.nama_barang}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.jumlah_pinjam} unit × {formatRupiah(d.harga_per_hari || d.barang?.harga_sewa)}/hari
                    </p>
                  </div>
                  <p className="text-xs font-bold shrink-0">{formatRupiah(d.subtotal)}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Ringkasan Penyewaan ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Periode Sewa" value={`${trans.tanggal_mulai} — ${trans.tanggal_selesai} (${trans.total_hari} hari)`} />
            <InfoRow icon={<Store className="w-3.5 h-3.5" />} label="Pemilik" value={trans.pemilik?.nama || '-'} />
            <InfoRow icon={trans.metode_pengiriman === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />} label="Metode" value={trans.metode_pengiriman === 'pickup' ? 'Ambil di Tempat' : 'Delivery'} />
            <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Total Biaya" value={formatRupiah(trans.total_biaya)} highlight />
            {trans.metode_pengiriman === 'delivery' && Number(trans.biaya_pengiriman) > 0 && (
              <InfoRow icon={<Truck className="w-3.5 h-3.5" />} label="Ongkir" value={formatRupiah(trans.biaya_pengiriman)} />
            )}
            {trans.alamat_pengiriman && (
              <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Alamat" value={trans.alamat_pengiriman} colSpan />
            )}
          </div>

          {/* ── Deposit Info ── */}
          {Number(trans.nominal_deposit) > 0 && (
            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/10 dark:to-emerald-900/5 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Informasi Deposit
                </h5>
                {/* Status badge */}
                {trans.deposit_status === 'refunded' || trans.deposit_status === 'partial_refund' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✅ Sudah Direfund</span>
                ) : trans.deposit_status === 'pending' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">⏳ Menunggu Refund</span>
                ) : trans.deposit_status === 'forfeited' ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">❌ Hangus</span>
                ) : null}
              </div>

              {/* Deposit grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <MiniCard label="Deposit Awal" value={formatRupiah(trans.nominal_deposit)} />
                <MiniCard label="Denda Terlambat" value={formatRupiah(trans.pengembalian?.total_denda || 0)} negative={Number(trans.pengembalian?.total_denda || 0) > 0} />
                <MiniCard label="Denda Kerusakan" value={formatRupiah(trans.pengembalian?.denda_kerusakan || 0)} negative={Number(trans.pengembalian?.denda_kerusakan || 0) > 0} />
              </div>

              {/* Refund Status Detail */}
              {(trans.deposit_status === 'refunded' || trans.deposit_status === 'partial_refund') ? (
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Deposit Dikembalikan
                    </span>
                    <span className="text-base font-black text-emerald-600">{formatRupiah(trans.deposit_refund_amount)}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-emerald-700 dark:text-emerald-500 ml-5">
                    <p className="flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Metode: <strong>{trans.deposit_refund_method}</strong></p>
                    {trans.deposit_refunded_at && <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatDateTime(trans.deposit_refunded_at)}</p>}
                    {trans.deposit_refund_note && <p className="flex items-start gap-1.5"><MessageSquare className="w-3 h-3 mt-0.5" /> Catatan: "{trans.deposit_refund_note}"</p>}
                  </div>
                  {trans.deposit_refund_proof && (
                    <div className="ml-5">
                      <a href={getStorageUrl(trans.deposit_refund_proof)} target="_blank" rel="noopener noreferrer" className="inline-block group relative overflow-hidden rounded-lg border border-emerald-200 hover:border-emerald-400 transition">
                        <img src={getStorageUrl(trans.deposit_refund_proof)} alt="Bukti Transfer" className="w-28 h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                          <span className="text-white opacity-0 group-hover:opacity-100 text-[9px] font-semibold">Lihat Bukti</span>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              ) : trans.deposit_status === 'forfeited' ? (
                <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="font-bold text-red-700 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Deposit Hangus</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Seluruh deposit digunakan untuk membayar denda</span>
                  </div>
                  <span className="text-base font-black text-red-600">Rp 0</span>
                </div>
              ) : trans.deposit_status === 'pending' ? (
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="font-bold text-amber-800 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Menunggu Refund</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Admin akan segera memproses pengembalian deposit</span>
                  </div>
                  <span className="text-base font-black text-amber-600">{formatRupiah(sisaDeposit)}</span>
                </div>
              ) : (
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="font-bold text-emerald-800 block">Sisa Deposit</span>
                    <span className="text-[10px] text-muted-foreground">Dikembalikan setelah pengembalian barang</span>
                  </div>
                  <span className="text-base font-black text-emerald-600">{formatRupiah(sisaDeposit)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Completed: Return Info ── */}
          {trans.status_sewa === 'selesai' && trans.pengembalian && (
            <div className="bg-muted/40 rounded-xl p-4 border space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Informasi Pengembalian
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <MiniCard label="Tanggal Kembali" value={trans.tanggal_kembali_real || trans.pengembalian?.tanggal_kembali || '-'} />
                <MiniCard label="Jumlah Kembali" value={`${trans.pengembalian.jumlah_kembali || trans.jumlah} unit`} />
                <MiniCard label="Kondisi" value={trans.pengembalian.kondisi_barang || 'Baik'} />
                <div className="bg-card p-2.5 rounded-lg border">
                  <p className="text-muted-foreground font-semibold mb-0.5 text-[10px]">Status</p>
                  {trans.pengembalian.status_pengembalian === 'terlambat' ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Terlambat</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Tepat Waktu</span>
                  )}
                </div>
              </div>
              {trans.pengembalian.catatan && (
                <p className="text-[11px] italic text-muted-foreground bg-card px-3 py-2 rounded-lg border">
                  <MessageSquare className="w-3 h-3 inline mr-1 text-amber-500" />
                  "{trans.pengembalian.catatan}"
                </p>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          {trans.status_sewa === 'sedang_disewa' && trans.status_kembali === 'belum' && (
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 h-10 rounded-xl" onClick={() => openReturnModal(trans)}>
              <RotateCcw className="w-4 h-4" /> Kembalikan Barang
            </Button>
          )}

          {trans.status_sewa === 'sedang_disewa' && trans.status_kembali === 'proses' && (
            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Barang Sedang Dikembalikan
              </p>
              <p className="text-[11px] text-muted-foreground">
                Metode: <strong>{trans.metode_kembali === 'delivery' ? 'Kirim via Kurir' : 'Datang Langsung'}</strong>
                {trans.no_resi_kembali && <> · Resi: <strong className="font-mono">{trans.no_resi_kembali}</strong></>}
              </p>
              <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Menunggu verifikasi Admin
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-24 pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 md:gap-8">
          <Sidebar user={user} getPhotoUrl={getPhotoUrl} getInitials={getInitials} />

          <div className="lg:col-span-3 space-y-5">
            <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Penyewaan Saya</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Riwayat barang yang Anda sewa — aktif maupun selesai</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { key: 'all', label: 'Semua', count: stats.total },
                      { key: 'aktif', label: 'Aktif', count: stats.aktif },
                      { key: 'selesai', label: 'Selesai', count: stats.selesai },
                    ].map((tab) => (
                      <button key={tab.key} onClick={() => setRentalFilter(tab.key)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all border flex items-center gap-1 ${
                          rentalFilter === tab.key ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted border-border'
                        }`}>
                        {tab.label}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rentalFilter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border bg-background text-muted-foreground hover:bg-muted transition-all">
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
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">Belum ada penyewaan{rentalFilter !== 'all' ? ` yang ${rentalFilter}` : ''}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Barang yang Anda sewa akan tampil di sini</p>
                    <Link to="/sewa-alat">
                      <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white" size="sm">Mulai Rental</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredData.map(renderCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      {isReturnModalOpen && selectedReturnTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <RotateCcw className="size-5 text-amber-600" /> Kembalikan Barang
              </h2>
              <button onClick={() => { setIsReturnModalOpen(false); setSelectedReturnTrx(null); }} className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-xs space-y-1 text-amber-800 dark:text-amber-400">
                <p><strong>Peralatan:</strong> {selectedReturnTrx.nama_barang} ({selectedReturnTrx.jumlah} unit)</p>
                <p><strong>Batas Waktu:</strong> {selectedReturnTrx.tanggal_selesai}</p>
                <p className="text-[10px] mt-1 italic">* Keterlambatan pengembalian dikenakan denda Rp 20.000 per hari.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Metode Pengembalian</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setReturnForm(prev => ({ ...prev, metode_kembali: "pickup" }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition flex flex-col items-center gap-1.5 ${returnForm.metode_kembali === "pickup" ? "border-amber-500 bg-amber-50/50 text-amber-700 font-bold" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
                    <Store className="size-4" /> Datang Langsung
                  </button>
                  <button type="button" onClick={() => setReturnForm(prev => ({ ...prev, metode_kembali: "delivery" }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition flex flex-col items-center gap-1.5 ${returnForm.metode_kembali === "delivery" ? "border-amber-500 bg-amber-50/50 text-amber-700 font-bold" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
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
                </div>
              )}
              {returnForm.metode_kembali === "pickup" && (
                <div className="bg-muted/50 p-3 rounded-xl text-[11px] text-muted-foreground border border-dashed">
                  Silakan kembalikan barang ke petugas loket Gudang Utama SiPetualang sebelum batas waktu.
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 border-t">
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

// ── Reusable sub-components ──
function InfoRow({ icon, label, value, highlight, colSpan }) {
  return (
    <div className={`flex items-start gap-2 text-xs ${colSpan ? 'col-span-2' : ''}`}>
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground font-semibold">{label}</p>
        <p className={`font-semibold truncate ${highlight ? 'text-emerald-600' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}

function MiniCard({ label, value, negative }) {
  return (
    <div className="bg-card p-2.5 rounded-lg border">
      <p className="text-muted-foreground font-semibold mb-0.5 text-[10px]">{label}</p>
      <p className={`font-bold text-xs ${negative ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}