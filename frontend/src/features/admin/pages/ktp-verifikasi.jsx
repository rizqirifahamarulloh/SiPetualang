import { useEffect, useState } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";
import { adminService } from "../services/adminService";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
  ZoomIn,
  IdCard,
  Camera,
  Loader2,
  Store,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStorageUrl } from "@/utils/storageUrl";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800",
    icon: Clock,
    dot: "bg-amber-500",
  },
  disetujui: {
    label: "Disetujui",
    color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
    icon: ShieldCheck,
    dot: "bg-green-500",
  },
  ditolak: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
    icon: ShieldX,
    dot: "bg-red-500",
  },
};

export default function KtpVerification() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const PER_PAGE = 5;

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getVerifications();
      const items = response?.data ?? response ?? [];
      setData(Array.isArray(items) ? items : []);
      if (!Array.isArray(items)) {
        setError("Respons API tidak mengandung array verifikasi");
      }
    } catch (err) {
      console.error("Fetch verifikasi error:", err);
      setError(err?.response?.data?.message || err?.message || "Gagal memuat data verifikasi");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const approve = async (id, activateRental = false) => {
    setActionLoading(id);
    try {
      await adminService.approveVerification(id, activateRental);
      toast.success("Verifikasi berhasil disetujui!");
      getData();
    } catch (err) {
      toast.error("Gagal menyetujui verifikasi");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) {
      toast.warning("Masukkan alasan penolakan!");
      return;
    }
    setActionLoading(id);
    try {
      await adminService.rejectVerification(id, rejectReason);
      toast.success("Verifikasi berhasil ditolak");
      setRejectModal(null);
      setRejectReason("");
      getData();
    } catch (err) {
      toast.error("Gagal menolak verifikasi");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & Search
  const filteredData = data.filter((item) => {
    const matchSearch =
      !search ||
      item.pengguna?.nama?.toLowerCase().includes(search.toLowerCase()) ||
      item.pengguna?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || item.status_verifikasi === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalPending = data.filter((d) => d.status_verifikasi === "pending").length;
  const totalApproved = data.filter((d) => d.status_verifikasi === "disetujui").length;
  const totalRejected = data.filter((d) => d.status_verifikasi === "ditolak").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Verifikasi KTP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola dan verifikasi identitas KTP pengguna platform
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1.5">
          {data.length} Total Pengajuan
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-amber-200/50 dark:border-amber-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPending}</p>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200/50 dark:border-green-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalApproved}</p>
              <p className="text-xs text-muted-foreground">Disetujui</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200/50 dark:border-red-900/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl">
              <ShieldX className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRejected}</p>
              <p className="text-xs text-muted-foreground">Ditolak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border rounded-xl p-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:border-primary transition"
          />
        </div>
        <div className="flex gap-2">
          {["semua", "pending", "disetujui", "ditolak"].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer border ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {s === "semua" ? "Semua" : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Loader2 className="size-8 text-muted-foreground animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data verifikasi...</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-red-200 dark:border-red-900 rounded-2xl p-12 text-center">
          <XCircle className="size-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={getData}>Coba Lagi</Button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center">
          <Shield className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {search || filterStatus !== "semua"
              ? "Tidak ada verifikasi yang sesuai filter"
              : "Tidak ada permintaan verifikasi KTP saat ini"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginateArray(filteredData, currentPage, PER_PAGE).map((item) => {
              const isRentalRequest = item.catatan_admin === "[PENDAFTARAN_RENTAL]";
              const status = STATUS_CONFIG[item.status_verifikasi] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isProcessing = actionLoading === item.id_verifikasi;

              return (
                <Card
                  key={item.id_verifikasi}
                  className={`overflow-hidden transition-shadow hover:shadow-md ${
                    isRentalRequest ? "border-blue-300 dark:border-blue-800" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {item.pengguna?.nama?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">{item.pengguna?.nama || "Pengguna"}</h3>
                          {isRentalRequest && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold border border-blue-200 dark:border-blue-800">
                              <Store className="size-3" />
                              PENGAJUAN RENTAL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {item.pengguna?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3" /> {item.pengguna.email}
                            </span>
                          )}
                          {item.pengguna?.no_telp && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" /> {item.pengguna.no_telp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                      <StatusIcon className="size-3.5" />
                      {status.label}
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* KTP Image */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <IdCard className="size-4 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foto KTP</p>
                        </div>
                        <div
                          className="relative group cursor-pointer rounded-xl overflow-hidden border bg-muted/30"
                          onClick={() => setPreviewImage(getStorageUrl(item.foto_ktp))}
                        >
                          <img
                            src={getStorageUrl(item.foto_ktp)}
                            alt="Foto KTP"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = "";
                              e.target.alt = "Foto tidak tersedia";
                              e.target.className = "w-full h-48 bg-muted flex items-center justify-center";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
                              <ZoomIn className="size-5 text-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selfie Image */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Camera className="size-4 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selfie + KTP</p>
                        </div>
                        <div
                          className="relative group cursor-pointer rounded-xl overflow-hidden border bg-muted/30"
                          onClick={() => setPreviewImage(getStorageUrl(item.foto_selfie_ktp))}
                        >
                          <img
                            src={getStorageUrl(item.foto_selfie_ktp)}
                            alt="Selfie KTP"
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = "";
                              e.target.alt = "Foto tidak tersedia";
                              e.target.className = "w-full h-48 bg-muted flex items-center justify-center";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
                              <ZoomIn className="size-5 text-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 flex flex-col gap-3 justify-center">
                        {item.status_verifikasi === "pending" ? (
                          <>
                            {isRentalRequest ? (
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-2"
                                onClick={() => approve(item.id_verifikasi, true)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Store className="size-4" />
                                )}
                                <span className="text-xs">Approve & Aktifkan Rental</span>
                              </Button>
                            ) : (
                              <Button
                                className="w-full gap-2"
                                onClick={() => approve(item.id_verifikasi, false)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-4" />
                                )}
                                Approve
                              </Button>
                            )}

                            <Button
                              variant="destructive"
                              className="w-full gap-2"
                              onClick={() => { setRejectModal(item.id_verifikasi); setRejectReason(""); }}
                              disabled={isProcessing}
                            >
                              <XCircle className="size-4" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <div className="text-center p-4 bg-muted/30 rounded-xl">
                            <StatusIcon className={`size-8 mx-auto mb-2 ${
                              item.status_verifikasi === "disetujui" ? "text-green-500" : "text-red-500"
                            }`} />
                            <p className="text-xs font-medium text-muted-foreground">
                              {item.status_verifikasi === "disetujui" ? "Sudah Disetujui" : "Sudah Ditolak"}
                            </p>
                            {item.catatan_admin && item.catatan_admin !== "[PENDAFTARAN_RENTAL]" && (
                              <p className="text-[11px] text-muted-foreground mt-1 italic">
                                "{item.catatan_admin}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredData.length}
            perPage={PER_PAGE}
            onPageChange={setCurrentPage}
            label="verifikasi"
          />
        </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-card border rounded-full shadow-lg hover:bg-muted transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[85vh] object-contain rounded-2xl border shadow-2xl bg-card"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldX className="size-5 text-red-500" />
                Tolak Verifikasi
              </h2>
              <button
                onClick={() => setRejectModal(null)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-muted transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Alasan Penolakan</label>
                <textarea
                  rows={3}
                  placeholder="Masukkan alasan kenapa verifikasi ini ditolak..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-background focus:outline-none focus:border-red-500 resize-none transition"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRejectModal(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => reject(rejectModal)}
                  disabled={actionLoading === rejectModal}
                >
                  {actionLoading === rejectModal ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Tolak Verifikasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}