import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/profile/services/profileService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';
import { BASE_URL } from '@/services/api';

export default function EditProfile() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.nama || '');
    const [phone, setPhone] = useState(user?.no_telp || '');
    const [address, setAddress] = useState(user?.alamat || '');
    const [city, setCity] = useState(user?.kota || '');
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    // ambil foto
    const getPhotoUrl = () => {
        if (preview) return preview;
        if (!user?.profile_photo) return null;
        return `${BASE_URL}/storage/${user.profile_photo}`;
    };

    // fallback avatar
    const getInitials = () => user?.nama?.charAt(0).toUpperCase() || 'U';

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // HANDLE SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // kirim hanya field yang ada
            const payload = {};
            if (name) payload.name = name;
            if (phone) payload.phone = phone;
            if (address) payload.address = address;
            if (city) payload.city = city;

            console.log("PAYLOAD:", payload);

            const res = await profileService.updateProfile(payload);

            let updatedUser = res.data.data;

            // upload foto
            if (photo) {
                const formData = new FormData();
                formData.append('profile_photo', photo);

                const photoRes = await profileService.updatePhoto(formData);

                updatedUser.profile_photo = photoRes.data.profile_photo;
            }

            // merge user lama + baru
            const finalUser = {
                ...user,
                ...updatedUser,
            };

            setUser(finalUser);
            localStorage.setItem('user', JSON.stringify(finalUser));

            toast.success('Profil berhasil diupdate');
            navigate('/profile');

        } catch (err) {
            console.log("ERROR FULL:", err.response);

            toast.error(
                err.response?.data?.message ||
                JSON.stringify(err.response?.data?.errors) ||
                'Gagal update'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-20">
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profil</CardTitle>
                        <CardDescription>
                            Perbarui data akun Kamu
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {getPhotoUrl() ? (
                                        <img
                                            src={getPhotoUrl()}
                                            alt="profile"
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                                            {getInitials()}
                                        </div>
                                    )}

                                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer">
                                        <Camera size={16} />
                                        <input
                                            type="file"
                                            hidden
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nama"
                                />
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Telepon"
                                />
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Alamat"
                                />
                                <Input
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Kota"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <Button type="submit" disabled={loading} className="gap-2 w-full md:w-auto">
                                    <Save size={16} />
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                </Button>

                                <Link to="/profile" className="w-full md:w-auto">
                                    <Button variant="outline" className="w-full">
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