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
  Star,
  Camera,
  X,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/services/api';
import { getStorageUrl } from '@/utils/storageUrl';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────
const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatDateTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

// ── Status configs
const STATUS_CONFIG = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', icon: Clock, cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  dibayar:             { label: 'Dibayar',             icon: CreditCard, cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  sedang_disewa:       { label: 'Sedang Disewa',       icon: Package, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  selesai:             { label: 'Selesai',             icon: CheckCircle, cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  dibatalkan:          { label: 'Dibatalkan',          icon: XCircle, cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400' },
};

const PAYMENT_CONFIG = {
  pending: { label: 'Belum Bayar', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  sukses:  { label: 'Lunas',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  gagal:   { label: 'Gagal',      cls: 'bg-red-50 text-red-700 border-red-200' },
};

const FILTER_TABS = [
  { key: 'all',                  label: 'Semua',         icon: Filter },
  { key: 'menunggu_pembayaran',  label: 'Pending',       icon: Clock },
  { key: 'dibayar',              label: 'Dibayar',       icon: CreditCard },
  { key: 'sedang_disewa',        label: 'Disewa',        icon: Package },
  { key: 'selesai',              label: 'Selesai',       icon: CheckCircle },
];

// ─── Component ────────────────────────────────────
export default function TransaksiPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [processingId, setProcessingId] = useState(null);

  // Review state
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [reviewPhotoPreviews, setReviewPhotoPreviews] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedTransactions, setReviewedTransactions] = useState(new Set());
  const [depositProofView, setDepositProofView] = useState(null);

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

  useEffect(() => {
    const checkReviews = async () => {
      const selesai = transactions.filter(t => t.status_sewa === 'selesai');
      const reviewed = new Set();
      for (const t of selesai) {
        try {
          const res = await axios.get(`${API_URL}/customer/ulasan/check/${t.id_transaksi}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.has_review) reviewed.add(t.id_transaksi);
        } catch { /* skip */ }
      }
      setReviewedTransactions(reviewed);
    };
    if (transactions.length > 0) checkReviews();
  }, [transactions]);

  // ── Filtered & sorted
  const filteredData = useMemo(() => {
    let list = [...transactions];
    if (filter !== 'all') list = list.filter(t => t.status_sewa === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.nama_barang || '').toLowerCase().includes(q) ||
        (t.midtrans_order_id || '').toLowerCase().includes(q) ||
        String(t.id_transaksi).includes(q)
      );
    }
    list.sort((a, b) => {
      const dA = new Date(a.created_at).getTime();
      const dB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dB - dA : dA - dB;
    });
    return list;
  }, [transactions, filter, searchQuery, sortOrder]);

  const stats = useMemo(() => {
    const counts = {};
    FILTER_TABS.forEach(t => { counts[t.key] = t.key === 'all' ? transactions.length : transactions.filter(tr => tr.status_sewa === t.key).length; });
    return counts;
  }, [transactions]);

  // ── Payment
  const handlePayment = async (trans) => {
    setProcessingId(trans.id_transaksi);
    try {
      let snapToken = trans.snap_token;
      if (!snapToken) {
        const response = await axios.post(`${API_URL}/customer/transaksi/${trans.id_transaksi}/refresh-payment`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  // ── Review handlers
  const openReviewModal = (trans) => {
    setReviewModal(trans);
    setReviewRating(0);
    setReviewComment('');
    setReviewPhotos([]);
    setReviewPhotoPreviews([]);
  };

  const handleReviewPhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - reviewPhotos.length;
    if (remaining <= 0) { toast.error('Maksimal 5 foto'); return; }
    const newFiles = files.slice(0, remaining);
    setReviewPhotos(prev => [...prev, ...newFiles]);
    setReviewPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeReviewPhoto = (index) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setReviewPhotoPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const submitReview = async () => {
    if (reviewRating === 0) { toast.error('Pilih rating terlebih dahulu'); return; }
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('id_transaksi', reviewModal.id_transaksi);
      formData.append('rating', reviewRating);
      if (reviewComment.trim()) formData.append('komentar', reviewComment);
      reviewPhotos.forEach((file) => formData.append('foto_ulasan[]', file));
      await axios.post(`${API_URL}/customer/ulasan`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Ulasan berhasil dikirim!');
      setReviewedTransactions(prev => new Set([...prev, reviewModal.id_transaksi]));
      setReviewModal(null);
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.errors ? Object.values(data.errors).flat()[0] : data?.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) return null;

  // ── Render card ──
  const renderCard = (trans) => {
    const cfg = STATUS_CONFIG[trans.status_sewa] || STATUS_CONFIG.selesai;
    const Icon = cfg.icon;
    const payCfg = PAYMENT_CONFIG[trans.status_pembayaran] || PAYMENT_CONFIG.pending;

    return (
      <div key={trans.id_transaksi} className="border rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
        {/* ─ Header ─ */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">{trans.nama_barang}</h3>
              <p className="text-[11px] text-muted-foreground">
                #{trans.midtrans_order_id || trans.id_transaksi}
                <span className="mx-1">·</span>
                {formatDateTime(trans.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`text-[9px] font-bold border ${cfg.cls}`}>
              <Icon className="w-2.5 h-2.5 mr-0.5" />{cfg.label}
            </Badge>
            <Badge className={`text-[9px] font-bold border ${payCfg.cls}`}>{payCfg.label}</Badge>
          </div>
        </div>

        {/* ─ Body ─ */}
        <div className="p-5 space-y-4">

          {/* Daftar Barang */}
          {trans.detail_transaksi?.length > 0 && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{trans.detail_transaksi.length} Barang</p>
              {trans.detail_transaksi.map((d, idx) => (
                <div key={d.id_detail || idx} className="flex items-center gap-2.5 bg-card rounded-lg p-2 border text-xs">
                  {d.barang?.foto_barang ? (
                    <img src={getStorageUrl(d.barang.foto_barang)} alt="" className="w-9 h-9 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{d.nama_barang || d.barang?.nama_barang}</p>
                    <p className="text-muted-foreground text-[10px]">{d.jumlah_pinjam} unit × {formatRupiah(d.harga_per_hari || d.barang?.harga_sewa)}/hari</p>
                  </div>
                  <p className="font-bold shrink-0">{formatRupiah(d.subtotal)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ringkasan */}
          <div className="grid grid-cols-2 gap-3">
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
            {Number(trans.nominal_deposit) > 0 && (
              <InfoRow icon={<DollarSign className="w-3.5 h-3.5" />} label="Deposit" value={formatRupiah(trans.nominal_deposit)} />
            )}
          </div>

          {/* Deposit Refund Status — for completed transactions */}
          {trans.status_sewa === 'selesai' && Number(trans.nominal_deposit) > 0 && trans.deposit_status && trans.deposit_status !== 'none' && (
            <DepositStatusSection trans={trans} setDepositProofView={setDepositProofView} />
          )}

          {/* Actions */}
          {trans.status_sewa === 'menunggu_pembayaran' && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-xs gap-2 rounded-xl" onClick={() => handlePayment(trans)} disabled={processingId === trans.id_transaksi}>
              <CreditCard className="w-3.5 h-3.5" />
              {processingId === trans.id_transaksi ? 'Memproses...' : 'Bayar Sekarang'}
            </Button>
          )}

          {trans.status_sewa === 'selesai' && (
            <div className="pt-1">
              {reviewedTransactions.has(trans.id_transaksi) ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold justify-center py-2 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5" /> Sudah Diulas
                </div>
              ) : (
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white h-10 text-xs gap-2 rounded-xl" onClick={() => openReviewModal(trans)}>
                  <Star className="w-3.5 h-3.5" /> Beri Ulasan
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3">
            <Sidebar user={user} isKtpVerified={user?.is_verified} getPhotoUrl={getPhotoUrl} getInitials={getInitials} />
          </div>

          <div className="md:col-span-8 lg:col-span-9 space-y-5">
            {/* Header Card */}
            <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Transaksi Saya</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Semua transaksi penyewaan Anda</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-1.5">
                    {FILTER_TABS.map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all border flex items-center gap-1 ${
                            filter === tab.key ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted border-border'
                          }`}>
                          <TabIcon className="w-3 h-3" />
                          {tab.label}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{stats[tab.key] || 0}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search + Sort */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                      <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border rounded-full w-40 focus:outline-none focus:border-blue-500 bg-background" />
                    </div>
                    <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-full border bg-background text-muted-foreground hover:bg-muted transition">
                      {sortOrder === 'newest' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
                    </button>
                  </div>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm text-muted-foreground">Memuat transaksi...</span>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                      <Receipt className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">Belum ada transaksi</h3>
                    <p className="text-xs text-muted-foreground mt-1">Transaksi Anda akan muncul di sini setelah melakukan penyewaan</p>
                    <Link to="/sewa-alat">
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" size="sm">Mulai Sewa</Button>
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

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> Beri Ulasan</h2>
              <button onClick={() => setReviewModal(null)} className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl text-xs space-y-1 border">
                <p><strong>Barang:</strong> {reviewModal.nama_barang}</p>
                <p><strong>Periode:</strong> {reviewModal.tanggal_mulai} — {reviewModal.tanggal_selesai}</p>
              </div>
              {/* Rating */}
              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Berikan Rating</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)} className="transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Comment */}
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Tulis ulasan Anda..." rows="3"
                className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-amber-500 bg-card resize-none" />
              {/* Photos */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Foto ({reviewPhotos.length}/5)</p>
                <div className="flex flex-wrap gap-2">
                  {reviewPhotoPreviews.map((src, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeReviewPhoto(idx)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {reviewPhotos.length < 5 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <input type="file" accept="image/*" multiple onChange={handleReviewPhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <Button onClick={submitReview} disabled={submittingReview || reviewRating === 0} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2">
                {submittingReview ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : <><Star className="w-4 h-4" /> Kirim Ulasan</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Deposit Proof Lightbox */}
    {depositProofView && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setDepositProofView(null)}>
        <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDepositProofView(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"><X className="w-6 h-6" /></button>
          <img src={depositProofView} alt="Bukti Transfer" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          <p className="text-center text-white/70 text-xs mt-3">Bukti Transfer Refund Deposit</p>
        </div>
      </div>
    )}
    </>
  );
}

// ─── Reusable sub-components ───

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

function DepositStatusSection({ trans, setDepositProofView }) {
  const sisaDeposit = Math.max(0, Number(trans.nominal_deposit || 0) - Number(trans.pengembalian?.denda_kerusakan || 0) - Number(trans.pengembalian?.total_denda || 0));

  if (trans.deposit_status === 'pending') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Menunggu Refund Deposit</span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Admin akan segera memproses pengembalian deposit</span>
        </div>
        <span className="text-base font-black text-amber-600 shrink-0">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(sisaDeposit)}</span>
      </div>
    );
  }

  if (trans.deposit_status === 'refunded' || trans.deposit_status === 'partial_refund') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Deposit Dikembalikan
          </span>
          <span className="text-base font-black text-emerald-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trans.deposit_refund_amount)}</span>
        </div>
        <div className="text-[11px] space-y-0.5 text-emerald-700 dark:text-emerald-500 ml-5">
          <p className="flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Metode: <strong>{trans.deposit_refund_method}</strong></p>
          {trans.deposit_refunded_at && <p className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(trans.deposit_refunded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
          {trans.deposit_refund_note && <p className="flex items-start gap-1.5"><MessageSquare className="w-3 h-3 mt-0.5" /> Catatan: "{trans.deposit_refund_note}"</p>}
        </div>
        {trans.deposit_refund_proof && (
          <div className="ml-5">
            <button onClick={() => setDepositProofView(getStorageUrl(trans.deposit_refund_proof))} className="inline-block group relative overflow-hidden rounded-lg border border-emerald-200 hover:border-emerald-400 transition">
              <img src={getStorageUrl(trans.deposit_refund_proof)} alt="Bukti" className="w-28 h-20 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                <span className="text-white opacity-0 group-hover:opacity-100 text-[9px] font-semibold">Lihat Bukti</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (trans.deposit_status === 'forfeited') {
    return (
      <div className="bg-red-50 dark:bg-red-950/10 p-3 rounded-xl border border-red-200 dark:border-red-900/30 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Deposit Hangus</span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Digunakan untuk membayar denda</span>
        </div>
        <span className="text-base font-black text-red-600 shrink-0">Rp 0</span>
      </div>
    );
  }

  return null;
}
