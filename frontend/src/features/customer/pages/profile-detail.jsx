import { useAuth } from '@/contexts/AuthContext';
import Navbar from "@/features/customer/components/Navbar";
import Sidebar from "@/features/customer/components/Sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Key, Trash2, User, Mail, Phone, MapPin, Shield, Building, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStorageUrl } from '@/utils/storageUrl';

export default function ProfileDetail() {
  const { user } = useAuth();

  if (!user) return null;

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);
  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

  const getRoleLabel = (role) => {
    const roleMap = { customer: 'Customer', perental: 'Perental', admin: 'Admin' };
    return roleMap[role] || role || 'Customer';
  };

  const formatTanggalLahir = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  // Check completeness
  const missingFields = [];
  if (!user.no_telp) missingFields.push('Nomor Telepon');
  if (!user.alamat) missingFields.push('Alamat');
  if (!user.kota) missingFields.push('Kota');
  if (!user.tanggal_lahir) missingFields.push('Tanggal Lahir');
  const isComplete = missingFields.length === 0;

  const fields = [
    { label: 'Nama Lengkap', value: user.nama, icon: User },
    { label: 'Alamat Email', value: user.email, icon: Mail },
    { label: 'Nomor Telepon', value: user.no_telp || '-', icon: Phone, missing: !user.no_telp },
    { label: 'Tanggal Lahir', value: formatTanggalLahir(user.tanggal_lahir), icon: Calendar, missing: !user.tanggal_lahir },
    { label: 'Peran Pengguna', value: getRoleLabel(user.peran_pengguna), icon: Shield },
    { label: 'Alamat', value: user.alamat || '-', icon: MapPin, missing: !user.alamat },
    { label: 'Kota', value: user.kota || '-', icon: Building, missing: !user.kota },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <Sidebar
            user={user}
            getPhotoUrl={getPhotoUrl}
            getInitials={getInitials}
          />

          <div className="lg:col-span-3 space-y-6">

            {/* ── Warning Banner ── */}
            {!isComplete && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Lengkapi Data Profil Anda</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Beberapa data profil Anda belum lengkap. Lengkapi profil agar pengalaman menyewa lebih mudah — alamat akan otomatis terisi saat checkout.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {missingFields.map((field) => (
                      <span key={field} className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-700">
                        {field}
                      </span>
                    ))}
                  </div>
                  <Link to="/profile/edit">
                    <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 rounded-xl">
                      <Edit className="w-3.5 h-3.5" /> Lengkapi Sekarang
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ── Complete Banner ── */}
            {isComplete && (
              <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Profil Anda sudah lengkap! Alamat akan otomatis terisi saat memesan barang.
                </p>
              </div>
            )}

            <Card className="border shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-8 py-6">
                <div className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  <CardTitle className="text-xl font-bold">Data Profil</CardTitle>
                </div>
                <CardDescription>
                  Informasi akun Kamu ditampilkan di sini dan dapat diedit melalui tombol di bawah.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8 space-y-10">
                {/* Foto & Nama */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {getPhotoUrl() ? (
                      <img src={getPhotoUrl()} alt="p" className="w-28 h-28 rounded-full object-cover border-4 border-card shadow-lg ring-2 ring-primary/10" />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shadow-lg ring-2 ring-primary/10">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-xl text-foreground">{user.nama}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
                    <Badge variant="outline" className="mt-2">{getRoleLabel(user.peran_pengguna)}</Badge>
                  </div>
                </div>

                {/* Grid Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 border-t border-border pt-8">
                  {fields.map((field, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition ${field.missing ? 'bg-amber-50/50 dark:bg-amber-950/10 border border-dashed border-amber-200 dark:border-amber-800' : 'bg-muted/30 hover:bg-muted/50'}`}>
                      <div className={`p-2 rounded-lg shrink-0 ${field.missing ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                        <field.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{field.label}</p>
                        <p className={`font-semibold truncate ${field.missing ? 'text-amber-500 italic text-sm' : 'text-foreground'}`}>
                          {field.missing ? 'Belum diisi' : field.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tombol Aksi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to="/profile/edit">
                <Button variant="outline" className="w-full gap-2">
                  <Edit className="size-4" /> Edit Profil
                </Button>
              </Link>
              <Link to="/profile/update-password">
                <Button variant="outline" className="w-full gap-2">
                  <Key className="size-4" /> Ubah Password
                </Button>
              </Link>
              <Link to="/profile/delete-akun">
                <Button variant="destructive" className="w-full gap-2 opacity-90">
                  <Trash2 className="size-4" /> Hapus Akun
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}