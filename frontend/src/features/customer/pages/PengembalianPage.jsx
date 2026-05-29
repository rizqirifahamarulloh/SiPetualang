import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/features/customer/components/Navbar";
import Sidebar from "@/features/customer/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api, { BASE_URL } from "@/services/api";
import { getStorageUrl } from "@/utils/storageUrl";
import {
  RotateCcw,
  Camera,
  Send,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  Loader2,
  Banknote,
  Truck,
  MapPin,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  Receipt,
  ShieldCheck,
  CreditCard,
  Building2,
  User as UserIcon,
} from "lucide-react";

const REFUND_STATUS_LABELS = {
  belum_refund: "Belum Direfund",
  proses_refund: "Sedang Diproses",
  sudah_refund: "Sudah Direfund",
};

const REFUND_STATUS_COLORS = {
  belum_refund: "bg-gray-100 text-gray-600 border-gray-200",
  proses_refund: "bg-blue-100 text-blue-700 border-blue-200",
  sudah_refund: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_MAP = {
  pending: { label: "Menunggu Review", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  disetujui: { label: "Disetujui", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  ditolak: { label: "Ditolak", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const formatRupiah = (val) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);

export default function PengembalianPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaksi, setSelectedTransaksi] = useState("");
  const [alasan, setAlasan] = useState("");
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [metodePengembalian, setMetodePengembalian] = useState("pickup");
  const [alamatPengembalian, setAlamatPengembalian] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [atasNamaRekening, setAtasNamaRekening] = useState("");

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);
  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || "U";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/customer/pengembalian");
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/customer/transaksi/sebagai-penyewa");
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter out transactions that already have pending/approved refund requests
  const availableTransactions = transactions.filter((tx) => {
    return !requests.some(
      (req) =>
        req.id_transaksi === tx.id_transaksi &&
        (req.status === "pending" || req.status === "disetujui")
    );
  });

  useEffect(() => {
    fetchRequests();
    fetchTransactions();
  }, []);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      toast.error("Maksimal 5 foto");
      return;
    }
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTransaksi) {
      toast.error("Pilih transaksi terlebih dahulu");
      return;
    }
    if (!alasan || alasan.length < 10) {
      toast.error("Alasan minimal 10 karakter");
      return;
    }
    if (photos.length === 0) {
      toast.error("Upload minimal 1 foto bukti");
      return;
    }
    if (metodePengembalian === "delivery" && !alamatPengembalian.trim()) {
      toast.error("Alamat pengembalian wajib diisi untuk metode delivery");
      return;
    }
    if (!namaBank.trim()) {
      toast.error("Nama bank wajib diisi");
      return;
    }
    if (!noRekening.trim()) {
      toast.error("Nomor rekening wajib diisi");
      return;
    }
    if (!atasNamaRekening.trim()) {
      toast.error("Nama pemilik rekening wajib diisi");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("id_transaksi", selectedTransaksi);
      formData.append("alasan", alasan);
      formData.append("metode_pengembalian", metodePengembalian);
      formData.append("nama_bank", namaBank);
      formData.append("no_rekening", noRekening);
      formData.append("atas_nama_rekening", atasNamaRekening);
      if (metodePengembalian === "delivery") {
        formData.append("alamat_pengembalian", alamatPengembalian);
      }
      photos.forEach((photo) => {
        formData.append("foto_bukti[]", photo);
      });

      await api.post("/customer/pengembalian", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Pengajuan pengembalian berhasil dikirim!");
      setShowModal(false);
      resetForm();
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengirim pengajuan");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedTransaksi("");
    setAlasan("");
    setPhotos([]);
    setPhotoPreviews([]);
    setMetodePengembalian("pickup");
    setAlamatPengembalian("");
    setNamaBank("");
    setNoRekening("");
    setAtasNamaRekening("");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3">
            <Sidebar
              user={user}
              isKtpVerified={user?.is_verified}
              getPhotoUrl={getPhotoUrl}
              getInitials={getInitials}
            />
          </div>

          <div className="md:col-span-8 lg:col-span-9">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Pengajuan Pengembalian</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ajukan pengembalian barang yang tidak sesuai kondisi
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                    Ajukan Pengembalian
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-700">Belum ada pengajuan</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Jika barang yang Anda terima tidak sesuai kondisi, Anda dapat mengajukan pengembalian.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((req) => {
                      const statusCfg = STATUS_MAP[req.status] || STATUS_MAP.pending;
                      const StatusIcon = statusCfg.icon;
                      const fotoBukti = Array.isArray(req.foto_bukti) ? req.foto_bukti : [];

                      return (
                        <div
                          key={req.id_pengajuan}
                          className="border rounded-xl p-5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={`text-[10px] font-bold border ${statusCfg.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusCfg.label}
                                </Badge>
                                {/* Metode pengembalian badge */}
                                <Badge className={`text-[10px] font-bold border ${
                                  req.metode_pengembalian === 'delivery'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  {req.metode_pengembalian === 'delivery' ? (
                                    <><Truck className="w-3 h-3 mr-1" /> Delivery</>
                                  ) : (
                                    <><MapPin className="w-3 h-3 mr-1" /> Pickup</>
                                  )}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(req.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <h4 className="font-bold text-sm text-gray-900">
                                {req.transaksi?.nama_barang || "Barang"}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                <strong>Alasan:</strong> {req.alasan}
                              </p>

                              {/* Alamat pengembalian */}
                              {req.metode_pengembalian === 'delivery' && req.alamat_pengembalian && (
                                <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span>{req.alamat_pengembalian}</span>
                                </div>
                              )}

                              {/* Info Rekening */}
                              {req.nama_bank && req.no_rekening && (
                                <div className="mt-2 flex items-start gap-2 text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                  <CreditCard className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                                  <div className="text-emerald-700">
                                    <span className="font-bold">{req.nama_bank}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-mono">{req.no_rekening}</span>
                                    <span className="mx-1">•</span>
                                    <span>a.n. {req.atas_nama_rekening}</span>
                                  </div>
                                </div>
                              )}

                              {req.catatan_admin && (
                                <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${
                                  req.status === "disetujui"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                  <strong>Catatan Admin:</strong> {req.catatan_admin}
                                </div>
                              )}

                              {/* Dynamic Refund Breakdown */}
                              {req.status === 'disetujui' && req.jumlah_refund > 0 && (
                                <div className="mt-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                                  <div className="flex items-center gap-1.5 mb-3">
                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700">Rincian Refund Dinamis</span>
                                  </div>

                                  {/* Breakdown Items */}
                                  <div className="space-y-2 text-xs">
                                    {req.sisa_hari_sewa != null && (
                                      <div className="flex items-center justify-between text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-gray-400" />
                                          Sisa Hari Sewa
                                        </span>
                                        <span className="font-bold">{req.sisa_hari_sewa} hari</span>
                                      </div>
                                    )}

                                    {req.refund_sewa > 0 && (
                                      <div className="flex items-center justify-between text-emerald-700">
                                        <span className="flex items-center gap-1.5">
                                          <ArrowDownToLine className="w-3 h-3" />
                                          Refund Sewa (proporsional)
                                        </span>
                                        <span className="font-bold">+ {formatRupiah(req.refund_sewa)}</span>
                                      </div>
                                    )}

                                    {req.refund_deposit > 0 && (
                                      <div className="flex items-center justify-between text-emerald-700">
                                        <span className="flex items-center gap-1.5">
                                          <ShieldCheck className="w-3 h-3" />
                                          Pengembalian Deposit
                                        </span>
                                        <span className="font-bold">+ {formatRupiah(req.refund_deposit)}</span>
                                      </div>
                                    )}

                                    {req.potongan_admin_fee > 0 && (
                                      <div className="flex items-center justify-between text-rose-600">
                                        <span className="flex items-center gap-1.5">
                                          <ArrowUpFromLine className="w-3 h-3" />
                                          Potongan Admin Fee
                                        </span>
                                        <span className="font-bold">- {formatRupiah(req.potongan_admin_fee)}</span>
                                      </div>
                                    )}

                                    {/* Ongkir (ditanggung admin) */}
                                    {req.metode_pengembalian === 'delivery' && Number(req.biaya_ongkir_pengembalian) > 0 && (
                                      <div className="flex items-center justify-between text-blue-600 bg-blue-50/60 px-2 py-1.5 rounded-lg -mx-1">
                                        <span className="flex items-center gap-1.5">
                                          <Truck className="w-3 h-3" />
                                          Ongkir Pengembalian
                                        </span>
                                        <span className="font-bold text-[10px]">
                                          {formatRupiah(req.biaya_ongkir_pengembalian)}
                                          <span className="text-blue-400 ml-1 font-normal">(ditanggung admin)</span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Total */}
                                    <div className="border-t border-emerald-200 pt-2 mt-2 flex items-center justify-between">
                                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                        Total Refund
                                      </span>
                                      <span className="font-black text-base text-emerald-700">
                                        {formatRupiah(req.jumlah_refund)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Refund status & method */}
                                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-emerald-200 text-xs">
                                    <div>
                                      <span className="text-gray-400">Status:</span>
                                      <Badge className={`text-[9px] font-bold border mt-0.5 block w-fit ${REFUND_STATUS_COLORS[req.status_refund] || REFUND_STATUS_COLORS.belum_refund}`}>
                                        {REFUND_STATUS_LABELS[req.status_refund] || 'Belum Direfund'}
                                      </Badge>
                                    </div>
                                    {req.metode_refund && (
                                      <div>
                                        <span className="text-gray-400">Metode:</span>
                                        <p className="font-medium capitalize">{req.metode_refund.replace('_', ' ')}</p>
                                      </div>
                                    )}
                                    {req.tanggal_refund && (
                                      <div>
                                        <span className="text-gray-400">Tanggal:</span>
                                        <p className="font-medium">{new Date(req.tanggal_refund).toLocaleDateString('id-ID')}</p>
                                      </div>
                                    )}
                                  </div>

                                  {req.bukti_refund && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200">
                                      <span className="text-xs text-gray-400 block mb-1.5">Bukti Transfer dari Admin:</span>
                                      <img
                                        src={`${BASE_URL}/storage/${req.bukti_refund}`}
                                        alt="Bukti Transfer Refund"
                                        className="w-48 rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                        onClick={() => window.open(`${BASE_URL}/storage/${req.bukti_refund}`, '_blank')}
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=Bukti+Transfer"; }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Photo thumbnails */}
                            {fotoBukti.length > 0 && (
                              <div className="flex gap-1.5 flex-shrink-0">
                                {fotoBukti.slice(0, 3).map((foto, i) => (
                                  <img
                                    key={i}
                                    src={`${BASE_URL}/storage/${foto}`}
                                    alt={`Bukti ${i + 1}`}
                                    className="w-14 h-14 rounded-lg object-cover border"
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/60";
                                    }}
                                  />
                                ))}
                                {fotoBukti.length > 3 && (
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-xs font-bold text-gray-400">
                                    +{fotoBukti.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
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

      {/* Modal Pengajuan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold">Ajukan Pengembalian</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                <p className="font-bold mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Syarat Pengajuan:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                  <li>Upload minimal 1 foto bukti kondisi barang</li>
                  <li>Jelaskan alasan pengembalian secara detail</li>
                  <li>Pilih metode pengembalian (pickup atau delivery)</li>
                </ul>
              </div>

              {/* Pilih Transaksi */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Pilih Transaksi *
                </label>
                <select
                  value={selectedTransaksi}
                  onChange={(e) => setSelectedTransaksi(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                >
                  <option value="">-- Pilih transaksi --</option>
                  {availableTransactions.map((tx) => (
                    <option key={tx.id_transaksi} value={tx.id_transaksi}>
                      {tx.nama_barang} — Rp {Number(tx.total_biaya).toLocaleString()} ({new Date(tx.created_at).toLocaleDateString("id-ID")})
                    </option>
                  ))}
                </select>
                {availableTransactions.length === 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Tidak ada transaksi yang tersedia untuk diajukan pengembalian
                  </p>
                )}
              </div>

              {/* Metode Pengembalian */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Metode Pengembalian Barang *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Pickup */}
                  <button
                    type="button"
                    onClick={() => setMetodePengembalian("pickup")}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      metodePengembalian === "pickup"
                        ? "border-amber-500 bg-amber-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {metodePengembalian === "pickup" && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <MapPin className={`w-7 h-7 mb-2 ${metodePengembalian === "pickup" ? "text-amber-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-bold ${metodePengembalian === "pickup" ? "text-amber-700" : "text-gray-600"}`}>
                      Pickup
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center">Antar sendiri ke lokasi</span>
                  </button>

                  {/* Delivery */}
                  <button
                    type="button"
                    onClick={() => setMetodePengembalian("delivery")}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      metodePengembalian === "delivery"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {metodePengembalian === "delivery" && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <Truck className={`w-7 h-7 mb-2 ${metodePengembalian === "delivery" ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-bold ${metodePengembalian === "delivery" ? "text-blue-700" : "text-gray-600"}`}>
                      Delivery
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 text-center">Dikirim via kurir</span>
                  </button>
                </div>

                {/* Delivery info */}
                {metodePengembalian === "delivery" && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-bold">Ongkir ditanggung admin</p>
                      <p className="text-blue-500 mt-0.5">
                        Biaya pengiriman pengembalian barang akan ditanggung sepenuhnya oleh admin. Anda tidak perlu membayar ongkir.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alamat Pengembalian (if delivery) */}
              {metodePengembalian === "delivery" && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Alamat Pengambilan Barang *
                  </label>
                  <textarea
                    value={alamatPengembalian}
                    onChange={(e) => setAlamatPengembalian(e.target.value)}
                    rows={3}
                    placeholder="Masukkan alamat lengkap tempat kurir akan mengambil barang..."
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-background"
                  />
                </div>
              )}

              {/* Informasi Rekening */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Informasi Rekening untuk Refund *
                </label>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-emerald-700 mb-1">
                    <CreditCard className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <p>Masukkan informasi rekening Anda agar admin dapat mentransfer dana refund.</p>
                  </div>

                  {/* Nama Bank */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5 block">
                      <Building2 className="w-3 h-3" /> Nama Bank
                    </label>
                    <select
                      value={namaBank}
                      onChange={(e) => setNamaBank(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">-- Pilih Bank --</option>
                      <option value="BCA">BCA</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BSI">BSI</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Permata">Permata</option>
                      <option value="Danamon">Danamon</option>
                      <option value="BTPN">BTPN</option>
                      <option value="Jago">Jago</option>
                      <option value="SeaBank">SeaBank</option>
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                      <option value="GoPay">GoPay</option>
                      <option value="ShopeePay">ShopeePay</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* No Rekening */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5 block">
                      <CreditCard className="w-3 h-3" /> Nomor Rekening / E-Wallet
                    </label>
                    <input
                      type="text"
                      value={noRekening}
                      onChange={(e) => setNoRekening(e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Atas Nama */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5 block">
                      <UserIcon className="w-3 h-3" /> Atas Nama
                    </label>
                    <input
                      type="text"
                      value={atasNamaRekening}
                      onChange={(e) => setAtasNamaRekening(e.target.value)}
                      placeholder="Nama pemilik rekening sesuai buku tabungan"
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Alasan Pengembalian *
                </label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan kondisi barang yang tidak sesuai, misalnya: barang rusak, tidak lengkap, berbeda dari deskripsi..."
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-background"
                />
                <p className="text-[11px] text-gray-400 mt-1">{alasan.length}/1000 karakter (min. 10)</p>
              </div>

              {/* Upload Foto */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Foto Bukti * (maks. 5 foto)
                </label>

                <div className="grid grid-cols-5 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full aspect-square object-cover rounded-xl border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <label className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition">
                      <Camera className="w-5 h-5 text-gray-400" />
                      <span className="text-[9px] text-gray-400 mt-1">Tambah</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Pengajuan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
