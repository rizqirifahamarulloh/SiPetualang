import { useAuth } from '@/contexts/AuthContext';
import Navbar from "@/features/customer/components/Navbar";
import Sidebar from "@/features/customer/components/Sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Key, Trash2, User, Mail, Phone, MapPin, Shield, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStorageUrl } from '@/utils/storageUrl';

export default function ProfileDetail() {
  const { user } = useAuth();

  if (!user) return null;

  const getPhotoUrl = () => getStorageUrl(user?.profile_photo);

  const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

  const fields = [
    { label: 'Nama Lengkap', value: user.nama, icon: User },
    { label: 'Alamat Email', value: user.email, icon: Mail },
    { label: 'Nomor Telepon', value: user.no_telp || '-', icon: Phone },
    { label: 'Peran Pengguna', value: user.peran_pengguna || 'Customer', icon: Shield, capitalize: true },
    { label: 'Alamat', value: user.alamat || '-', icon: MapPin },
    { label: 'Kota', value: user.kota || '-', icon: Building },
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
                    <Badge variant="outline" className="mt-2 capitalize">{user.peran_pengguna || 'Customer'}</Badge>
                  </div>
                </div>

                {/* Grid Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 border-t border-border pt-8">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <field.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{field.label}</p>
                        <p className={`font-semibold text-foreground ${field.capitalize ? 'capitalize' : ''} truncate`}>
                          {field.value}
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