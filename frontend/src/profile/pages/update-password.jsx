// src/profile/pages/update-password.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/profile/services/profileService';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { Key } from 'lucide-react';

export default function UpdatePassword() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // validasi client-side
        if (newPassword !== confirmPassword) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setLoading(true);

        try {
            await profileService.updatePassword({
                current_password: oldPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });

            toast.success('Password berhasil diubah');
            navigate('/profile');
        } catch (err) {
            console.log("ERROR PASSWORD:", err.response);

            toast.error(
                err.response?.data?.message ||
                JSON.stringify(err.response?.data?.errors) ||
                'Gagal mengubah password'
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
                        <div className="flex items-center gap-2">
                            <Key size={18} />
                            <CardTitle>Ubah Password</CardTitle>
                        </div>
                        <CardDescription>
                            Pastikan password baru mudah diingat tapi aman
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <Input
                                    type="password"
                                    placeholder="Password lama"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />

                                <Input
                                    type="password"
                                    placeholder="Password baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />

                                <Input
                                    type="password"
                                    placeholder="Konfirmasi password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="md:col-span-2"
                                />

                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <Button type="submit" disabled={loading} className="w-full md:w-auto">
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