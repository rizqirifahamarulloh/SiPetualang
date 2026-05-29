import { useAuth } from '@/contexts/AuthContext';
import ProfileDetail from '@/features/customer/pages/profile-detail';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  if (user.peran_pengguna === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Halaman Profil Admin</h1>
        {/*return <ProfileDetailAdmin /> */}
      </div>
    );
  }
  return <ProfileDetail />;
}