import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  User,
  Package,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Home,
  Truck,
  RotateCcw,
  CreditCard
} from 'lucide-react';

export default function Sidebar({ user, isKtpVerified, getPhotoUrl, getInitials }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Profil Saya', path: '/profile', icon: <User size={16} /> },
    { name: 'Penyewaan Saya', path: '/profile/rentals', icon: <Package size={16} /> },
    { name: 'Transaksi', path: '/profile/transaksi', icon: <CreditCard size={16} /> },
    { name: 'Status Pengiriman', path: '/profile/pengiriman', icon: <Truck size={16} /> },
    { name: 'Pengembalian', path: '/profile/pengembalian', icon: <RotateCcw size={16} /> },
    { name: 'Verifikasi', path: '/customer/verification', icon: <Shield size={16} /> },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="size-20 mx-auto ring-4 ring-primary/20">
              <AvatarImage src={getPhotoUrl()} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-lg font-semibold mt-3">{user?.nama || 'User'}</h2>
          <Badge className={`mt-1 text-xs ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
            <CheckCircle size={10} className="mr-1" />
            {user?.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{user?.no_telp || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Indonesia</span>
          </div>
        </div>

        <Separator className="my-4" />

        <Link to="/">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Home size={14} />
            Kembali ke Beranda
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}