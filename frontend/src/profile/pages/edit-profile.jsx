import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/profile/services/profileService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Camera, Save, MapPin, Loader2, User, Phone, Building, Calendar, Navigation } from 'lucide-react';
import { BASE_URL } from '@/services/api';
import Navbar from '@/features/customer/components/Navbar';

export default function EditProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.nama || '');
    const [phone, setPhone] = useState(user?.no_telp || '');
    const [address, setAddress] = useState(user?.alamat || '');
    const [city, setCity] = useState(user?.kota || '');
    const [birthDate, setBirthDate] = useState(user?.tanggal_lahir || '');
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    if (!user) return null;

    const getPhotoUrl = () => {
        if (preview) return preview;
        if (!user?.profile_photo) return null;
        return `${BASE_URL}/storage/${user.profile_photo}`;
    };

    const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // ── Auto-detect location ──
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Browser Anda tidak mendukung geolocation');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`
                    );
                    const data = await response.json();

                    if (data.display_name) {
                        setAddress(data.display_name);
                    }

                    // Auto-fill city from address components
                    const addr = data.address || {};
                    const detectedCity = addr.city || addr.town || addr.municipality || addr.county || addr.state || '';
                    if (detectedCity && !city) {
                        setCity(detectedCity);
                    }

                    toast.success('Lokasi berhasil terdeteksi!');
                } catch (e) {
                    console.log('Gagal reverse geocoding:', e);
                    toast.error('Gagal mendeteksi alamat dari lokasi');
                }
                setGettingLocation(false);
            },
            (error) => {
                let errorMsg = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Izin lokasi ditolak. Beri izin akses lokasi di browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Informasi lokasi tidak tersedia.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Waktu permintaan lokasi habis.';
                        break;
                    default:
                        errorMsg = 'Terjadi kesalahan saat mendapatkan lokasi.';
                }
                toast.error(errorMsg);
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {};
            if (name) payload.name = name;
            if (phone) payload.phone = phone;
            if (address) payload.address = address;
            if (city) payload.city = city;
            if (birthDate) payload.birth_date = birthDate;

            const res = await profileService.updateProfile(payload);
            let updatedUser = res.data.data;

            if (photo) {
                const formData = new FormData();
                formData.append('profile_photo', photo);
                const photoRes = await profileService.updatePhoto(formData);
                updatedUser.profile_photo = photoRes.data.profile_photo;
            }

            const finalUser = { ...user, ...updatedUser };
            setUser(finalUser);
            localStorage.setItem('user', JSON.stringify(finalUser));

            toast.success('Profil berhasil diupdate!');
            navigate('/profile');
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                JSON.stringify(err.response?.data?.errors) ||
                'Gagal update profil'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
                <Card className="border shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b bg-muted/30 px-8 py-6">
                        <div className="flex items-center gap-2">
                            <User className="size-5 text-primary" />
                            <CardTitle className="text-xl font-bold">Edit Profil</CardTitle>
                        </div>
                        <CardDescription>
                            Perbarui data akun Kamu. Alamat yang diisi akan otomatis terisi saat checkout.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* ── Foto Profil ── */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {getPhotoUrl() ? (
                                        <img src={getPhotoUrl()} alt="profile" className="w-28 h-28 rounded-full object-cover border-4 border-card shadow-lg ring-2 ring-primary/10" />
                                    ) : (
                                        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shadow-lg ring-2 ring-primary/10">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <label className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition">
                                        <Camera size={16} />
                                        <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">Klik ikon kamera untuk mengubah foto</p>
                            </div>

                            {/* ── Data Pribadi ── */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                    <User className="w-4 h-4 text-primary" /> Data Pribadi
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <User className="w-3 h-3" /> Nama Lengkap
                                        </label>
                                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Phone className="w-3 h-3" /> Nomor Telepon
                                        </label>
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Tanggal Lahir
                                        </label>
                                        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-xl" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Lokasi & Alamat ── */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b pb-2">
                                    <MapPin className="w-4 h-4 text-primary" /> Lokasi & Alamat
                                </h3>

                                {/* Alamat with location button */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3" /> Alamat Lengkap
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Contoh: Jl. Sudirman No. 123, Jakarta Pusat"
                                        className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-primary bg-background resize-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-semibold transition-colors w-full md:w-auto justify-center"
                                    >
                                        {gettingLocation ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Mendeteksi lokasi...
                                            </>
                                        ) : (
                                            <>
                                                <Navigation className="w-4 h-4" />
                                                📍 Gunakan Lokasi Saya Saat Ini
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Alamat yang Anda isi akan otomatis terisi saat memesan barang dengan metode delivery.
                                    </p>
                                </div>

                                {/* Kota */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <Building className="w-3 h-3" /> Kota
                                    </label>
                                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Contoh: Jakarta, Bandung, Surabaya" className="rounded-xl" />
                                </div>
                            </div>

                            {/* ── Actions ── */}
                            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t">
                                <Button type="submit" disabled={loading} className="gap-2 w-full md:w-auto rounded-xl">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                                <Link to="/profile" className="w-full md:w-auto">
                                    <Button variant="outline" className="w-full rounded-xl">
                                        Batal
                                    </Button>
                                </Link>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}