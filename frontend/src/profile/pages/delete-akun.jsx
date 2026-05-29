// src/profile/pages/delete-akun.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/profile/services/profileService';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { Trash2 } from 'lucide-react';

export default function DeleteAkun() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [confirmText, setConfirmText] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    //HANDLE DELETE
    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            //validasi
            if (confirmText !== 'HAPUS AKUN') {
                toast.error('Ketik "HAPUS AKUN" dulu');
                setLoading(false);
                return;
            }

            if (!password) {
                toast.error('Password wajib diisi');
                setLoading(false);
                return;
            }

            //kirim password
            await profileService.deleteAccount({
                password,
            });

            toast.success('Akun berhasil dihapus');

            await logout();
            toast.info('Kamu telah keluar dari akun');
            navigate('/');
        } catch (err) {
            console.log("ERROR DELETE:", err.response);

            toast.error(
                err.response?.data?.message ||
                JSON.stringify(err.response?.data?.errors) ||
                'Gagal hapus akun'
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
                        <CardTitle>Hapus Akun</CardTitle>
                        <CardDescription>
                            Tindakan ini tidak dapat dibatalkan
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleDelete} className="space-y-6">

                            <div className="text-sm text-red-500">
                                ⚠️ Semua data akan dihapus permanen
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Ketik: HAPUS AKUN"
                                />

                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-3">
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    <Trash2 size={16} />
                                    {loading ? 'Menghapus...' : 'Hapus Akun'}
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