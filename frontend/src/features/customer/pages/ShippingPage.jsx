import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/features/customer/components/Navbar";
import Sidebar from "@/features/customer/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api, { BASE_URL } from "@/services/api";
import { getStorageUrl } from "@/utils/storageUrl";
import { 
 Truck, 
 MapPin, 
 Package, 
 CheckCircle2, 
 Clock, 
 ArrowRight,
 ShieldCheck,
 AlertCircle
} from "lucide-react";

export default function ShippingPage() {
 const { user } = useAuth();
 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 const getPhotoUrl = () => getStorageUrl(user?.profile_photo);

 const getInitials = () => user?.nama?.charAt(0).toUpperCase() || "U";

 const getShipments = async () => {
 setLoading(true);
 setError(null);
 try {
 const response = await api.get("/customer/pengiriman/list");
 const items = response?.data?.data ?? response?.data ?? [];
 setData(Array.isArray(items) ? items : []);
 } catch (err) {
 console.error("Fetch customer shipping list error:", err);
 setError(err?.response?.data?.message || err?.message || "Gagal memuat status pengiriman barang");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 getShipments();
 }, []);

 const handleConfirmReceived = async (idPengiriman) => {
 try {
 await api.post(`/customer/pengiriman/${idPengiriman}/terima`);
 toast.success("Konfirmasi penerimaan sukses! Status sewa Anda kini aktif.");
 getShipments();
 } catch (err) {
 console.error(err);
 toast.error(err?.response?.data?.message || "Gagal melakukan konfirmasi penerimaan");
 }
 };

 const getStatusStepClass = (currentStatus, targetStatus) => {
 const order = ["pending", "dikirim", "sampai", "diterima"];
 const currentIndex = order.indexOf(currentStatus);
 const targetIndex = order.indexOf(targetStatus);

 if (currentIndex >= targetIndex) {
 return "bg-emerald-600 border-emerald-600 text-white"; // Completed step
 }
 return "bg-card border-border text-muted-foreground "; // Pending step
 };

 const getLineClass = (currentStatus, targetStatus) => {
 const order = ["pending", "dikirim", "sampai", "diterima"];
 const currentIndex = order.indexOf(currentStatus);
 const targetIndex = order.indexOf(targetStatus);

 if (currentIndex >= targetIndex) {
 return "bg-emerald-600";
 }
 return "bg-slate-200 dark:bg-slate-700";
 };

 if (!user) return null;

 return (
 <div className="min-h-screen bg-background">
 {/* 1. Navbar */}
 <Navbar />

 <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* 2. Sidebar */}
 <Sidebar
 user={user}
 getPhotoUrl={getPhotoUrl}
 getInitials={getInitials}
 />

 {/* 3. Main Content */}
 <div className="lg:col-span-3 space-y-6">
 <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
 <CardHeader className="border-b bg-muted/30 px-8 py-6">
 <div className="flex items-center gap-2">
 <Truck className="size-5 text-emerald-600" />
 <CardTitle className="text-xl font-bold">Status Pengiriman Barang</CardTitle>
 </div>
 <CardDescription>
 Lacak keberadaan alat camping sewaan Anda yang dikirim melalui metode delivery kurir.
 </CardDescription>
 </CardHeader>

 <CardContent className="p-6 md:p-8">
 {loading ? (
 <div className="py-12 text-center text-muted-foreground">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
 <p className="text-sm font-medium">Memuat info pengiriman...</p>
 </div>
 </div>
 ) : error ? (
 <div className="py-8 text-center text-red-500 bg-red-50/50 border border-red-100 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-2">
 <AlertCircle className="size-8" />
 {error}
 </div>
 ) : data.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
 <Truck className="size-12 text-muted-foreground" />
 <p className="text-sm font-medium">Anda belum memiliki transaksi aktif dengan metode pengiriman delivery.</p>
 </div>
 ) : (
 <div className="space-y-8">
 {data.map((item) => {
 const shipping = item.pengiriman;
 const shippingStatus = shipping?.status_pengiriman || "pending";

 return (
 <div key={item.id_transaksi} className="border rounded-2xl p-6 bg-muted/50/30 space-y-6">
 {/* Info Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
 <div>
 <h4 className="font-bold text-foreground text-sm">
 Transaksi #{item.id_transaksi}
 </h4>
 {/* Multi-item display */}
 {item.detail_transaksi && item.detail_transaksi.length > 0 ? (
 <div className="mt-1.5 space-y-1">
 {item.detail_transaksi.map((detail, idx) => (
 <div key={detail.id_detail || idx} className="flex items-center gap-2">
 {detail.barang?.foto_barang && (
 <img
 src={getStorageUrl(detail.barang.foto_barang)}
 alt={detail.nama_barang || detail.barang?.nama_barang}
 className="w-8 h-8 rounded-lg object-cover border border-border"
 />
 )}
 <p className="text-xs text-muted-foreground font-medium">
 <strong className="text-foreground">{detail.nama_barang || detail.barang?.nama_barang}</strong>
 {' '}({detail.jumlah_pinjam} unit)
 {detail.barang?.pemilik && (
 <span className="text-muted-foreground"> — dari {detail.barang.pemilik.nama}</span>
 )}
 </p>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground mt-0.5 font-medium">
 Barang: <strong className="text-foreground">{item.nama_barang}</strong> ({item.jumlah} unit)
 </p>
 )}
 </div>
 <div className="text-right text-xs">
 <span className="text-muted-foreground">Total Biaya:</span>
 <p className="font-bold text-foreground">
 Rp {new Intl.NumberFormat("id-ID").format(item.total_biaya)}
 </p>
 </div>
 </div>

 {/* 4. Interactive Horizontal Timeline */}
 <div className="relative py-4 px-2">
 {/* Lines behind steps */}
 <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded"></div>
 
 <div className="absolute top-8 left-[10%] w-[80%] h-1 -z-10 rounded flex">
 <div className={`h-full ${getLineClass(shippingStatus, "dikirim")}`} style={{ width: "33%" }}></div>
 <div className={`h-full ${getLineClass(shippingStatus, "sampai")}`} style={{ width: "33%" }}></div>
 <div className={`h-full ${getLineClass(shippingStatus, "diterima")}`} style={{ width: "34%" }}></div>
 </div>

 <div className="grid grid-cols-4 text-center">
 {/* Step 1: Disiapkan */}
 <div className="flex flex-col items-center gap-2">
 <div className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${getStatusStepClass(shippingStatus, "pending")}`}>
 <Clock className="size-4" />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase">Diproses</span>
 </div>

 {/* Step 2: Dikirim */}
 <div className="flex flex-col items-center gap-2">
 <div className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${getStatusStepClass(shippingStatus, "dikirim")}`}>
 <Truck className="size-4" />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase">Dikirim</span>
 </div>

 {/* Step 3: Sampai */}
 <div className="flex flex-col items-center gap-2">
 <div className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${getStatusStepClass(shippingStatus, "sampai")}`}>
 <MapPin className="size-4" />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase">Tiba</span>
 </div>

 {/* Step 4: Diterima */}
 <div className="flex flex-col items-center gap-2">
 <div className={`size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${getStatusStepClass(shippingStatus, "diterima")}`}>
 <CheckCircle2 className="size-4" />
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase">Selesai</span>
 </div>
 </div>
 </div>

 {/* Info Detail Shipping */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border rounded-xl p-4 text-xs">
 <div className="space-y-1.5">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Detail Pengiriman</p>
 {shipping ? (
 <>
 <p className="text-muted-foreground ">
 <strong className="text-foreground">Kurir Pengantar:</strong> {shipping.kurir || "SiPetualang Delivery"}
 </p>
 <p className="text-muted-foreground ">
 <strong className="text-foreground">Nomor Resi:</strong> {shipping.no_resi || "-"}
 </p>
 </>
 ) : (
 <p className="text-muted-foreground italic">Penyedia sewa sedang mempersiapkan peralatan Anda di gudang.</p>
 )}
 </div>

 <div className="space-y-1.5 border-t md:border-t-0 md:border-l md:pl-4 pt-3 md:pt-0">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Posisi Terakhir</p>
 {shipping ? (
 <p className="text-foreground dark:text-muted-foreground font-semibold flex items-center gap-1">
 <MapPin className="size-4 text-emerald-600 shrink-0" />
 {shipping.lokasi_terakhir}
 </p>
 ) : (
 <p className="text-muted-foreground">Mempersiapkan penyerahan kurir.</p>
 )}
 </div>
 </div>

 {/* Dynamic Action Button */}
 <div className="pt-2">
 {/* CASE 1: Arrived - Show active Green Confirm Button */}
 {shippingStatus === "sampai" && (
 <Button
 className="bg-emerald-600 hover:bg-emerald-700 text-white w-full gap-2 rounded-xl py-5 text-sm font-semibold transition"
 onClick={() => handleConfirmReceived(shipping.id_pengiriman)}
 >
 <ShieldCheck className="size-4" />
 Barang Sudah Diterima
 </Button>
 )}

 {/* CASE 2: Shipped - Show Transit Label Badge */}
 {shippingStatus === "dikirim" && (
 <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center text-blue-700 font-bold text-xs uppercase flex items-center justify-center gap-2">
 <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
 <Truck className="size-4" />
 Status: Dalam Pengiriman (In Transit)
 </div>
 )}

 {/* CASE 3: Completed / Received */}
 {shippingStatus === "diterima" && (
 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-emerald-700 font-bold text-xs uppercase flex items-center justify-center gap-2">
 <CheckCircle2 className="size-4" />
 Barang Diterima & Status Sewa Aktif
 </div>
 )}

 {/* CASE 4: Pending / Preparing */}
 {shippingStatus === "pending" && (
 <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center text-amber-700 font-bold text-xs uppercase flex items-center justify-center gap-2">
 <Clock className="size-4" />
 Menunggu Pengiriman dari Perental
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
 </div>
 );
}
