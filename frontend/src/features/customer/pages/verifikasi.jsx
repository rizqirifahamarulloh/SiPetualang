import { useState, useEffect, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { customerService } from '../services/customerService';
import api, { BASE_URL } from '@/services/api';
import { getStorageUrl } from '@/utils/storageUrl';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shield, Upload, Camera, ChevronRight, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';

export default function Verifikasi() {
  const { user, setUser } = useAuth();
  const [ktp, setKtp] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const ktpInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const verificationStatus = user?.verification_status;
  const verificationNote = user?.verification_note;
  // Handle both boolean and string/integer truthy values
  const isApproved = user?.is_verified === true || user?.is_verified === 1 || user?.is_verified === 'true' || verificationStatus === 'disetujui';

  useEffect(() => {
    console.log('Verification Debug:', { 
      is_verified: user?.is_verified, 
      status: verificationStatus, 
      isApproved 
    });
  }, [user, verificationStatus, isApproved]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-base text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);

  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

  const handleKtpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setKtp(file);
      setKtpPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfie(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!ktp || !selfie) {
      toast.warning("Upload KTP & selfie terlebih dahulu!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("foto_ktp", ktp);
    formData.append("foto_selfie_ktp", selfie);

    try {
      await customerService.submitVerification(formData);
      toast.success("Dokumen verifikasi berhasil dikirim!");
      
      // Refresh user data using the api service
      const res = await api.get('/profile');
      const updatedUser = { ...user, ...res.data.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setKtp(null);
      setSelfie(null);
      setKtpPreview(null);
      setSelfiePreview(null);
    } catch (err) {
      console.error('Upload verifikasi error:', err);
      const message = err?.response?.data?.message || err?.message || 'Gagal upload dokumen';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    // Prioritas 1: Jika sudah disetujui/verified
    if (isApproved) {
      return (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Identitas Kamu sudah disetujui</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Selamat! Verifikasi akun Kamu telah berhasil. Silahkan merental alat yang ada di platform kami.
          </p>
          <Button onClick={() => window.location.href = '/sewa-alat'}>
            Mulai Rental Sekarang
          </Button>
        </div>
      );
    }

    // Prioritas 2: Jika sedang menunggu
    if (verificationStatus === 'pending') {
      return (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Data Kamu sudah terkirim</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Mohon tunggu untuk diverifikasi oleh admin. Proses ini memakan waktu maksimal 1x24 jam.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Kembali ke Beranda
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {verificationStatus === 'ditolak' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-2">
            <XCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-red-800">Verifikasi Ditolak</p>
              <p className="text-xs text-red-700 leading-relaxed">
                KTP ditolak dikarenakan: <strong className="bg-red-100 px-1 rounded">{verificationNote}</strong>. Tolong upload ulang foto yang lebih jelas.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KTP */}
          <div
            onClick={() => ktpInputRef.current?.click()}
            className={`group p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ${
              ktp
                ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500'
                : 'border-muted-foreground/30 hover:border-primary hover:bg-accent/50'
            }`}
          >
            {ktpPreview ? (
              <div className="space-y-3">
                <img
                  src={ktpPreview}
                  alt="Preview KTP"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="size-3.5" /> {ktp.name}
                </p>
                <p className="text-[11px] text-muted-foreground">Klik untuk mengganti foto</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <Upload className="text-primary size-6" />
                </div>
                <p className="text-sm font-semibold mb-1">Foto KTP Asli</p>
                <p className="text-xs text-muted-foreground">Klik untuk upload foto KTP</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">JPG, PNG, maks 5MB</p>
              </>
            )}
            <input
              ref={ktpInputRef}
              type="file"
              accept="image/*"
              onChange={handleKtpChange}
              className="hidden"
            />
          </div>

          {/* SELFIE */}
          <div
            onClick={() => selfieInputRef.current?.click()}
            className={`group p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ${
              selfie
                ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500'
                : 'border-muted-foreground/30 hover:border-primary hover:bg-accent/50'
            }`}
          >
            {selfiePreview ? (
              <div className="space-y-3">
                <img
                  src={selfiePreview}
                  alt="Preview Selfie"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="size-3.5" /> {selfie.name}
                </p>
                <p className="text-[11px] text-muted-foreground">Klik untuk mengganti foto</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <Camera className="text-primary size-6" />
                </div>
                <p className="text-sm font-semibold mb-1">Selfie + KTP</p>
                <p className="text-xs text-muted-foreground">Klik untuk upload selfie bersama KTP</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">JPG, PNG, maks 5MB</p>
              </>
            )}
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelfieChange}
              className="hidden"
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg">
          <div className="space-y-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-500" /> Panduan Foto KTP
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>KTP harus asli, bukan fotokopi</li>
              <li>Tulisan dan angka terbaca jelas</li>
              <li>Tidak tertutup bayangan atau pantulan cahaya</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-500" /> Panduan Selfie
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Wajah terlihat jelas tanpa masker/kacamata hitam</li>
              <li>Pegang KTP di bawah dagu, jangan tutupi wajah</li>
              <li>Pastikan kamera fokus pada wajah dan KTP</li>
            </ul>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Data Kamu Terenkripsi</p>
            <p className="text-xs text-muted-foreground">Kami menjamin kerahasiaan dokumen Kamu hanya untuk verifikasi internal.</p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-11"
        >
          {loading ? "Sedang Mengirim..." : "Kirim Dokumen Verifikasi"}
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Sidebar
              user={user}
              getPhotoUrl={getPhotoUrl}
              getInitials={getInitials}
            />
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-primary" />
                    <CardTitle>Verifikasi Identitas KTP</CardTitle>
                  </div>
                  <CardDescription>
                    KTP diperlukan untuk prosedur keamanan penyewaan alat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderStatus()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}