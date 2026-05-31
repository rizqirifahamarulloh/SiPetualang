import { useState, useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getStorageUrl } from '@/utils/storageUrl'
import { useLanguage } from '@/contexts/LanguageContext'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import adminLogo from '@/assets/beranda/Property-1-LogoMark.png'
import { adminService } from '../services/adminService'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  LogOut,
  ChevronUp,
  Settings,
  MapPin,
  FolderOpen,
  Shield,
  Truck,
  Layers,
  RotateCcw,
  Wallet,
} from 'lucide-react'

function useMenuGroups() {
  const { t } = useLanguage()

  return [
    {
      label: 'Dashboard',
      items: [
        { label: t('admin.dashboard'), icon: LayoutDashboard, href: '/admin/dashboard' },
      ],
    },
    {
      label: 'Manajemen',
      items: [
        { label: t('admin.users'), icon: Users, href: '/admin/users', badgeKey: 'users', badgeColor: 'emerald' },
        { label: t('admin.gears'), icon: Package, href: '/admin/gears', badgeKey: 'gears', badgeColor: 'orange' },
        { label: t('admin.categories'), icon: FolderOpen, href: '/admin/categories' },
        { label: t('admin.destinations'), icon: MapPin, href: '/admin/destinations' },
      ],
    },
    {
      label: 'Transaksi',
      items: [
        { label: t('admin.transactions'), icon: ShoppingCart, href: '/admin/revenue', badgeKey: 'transactions', badgeColor: 'blue' },
        { label: 'Status Pengiriman', icon: Truck, href: '/admin/pengiriman', badgeKey: 'pengiriman', badgeColor: 'blue' },
        { label: 'Barang Disewakan', icon: Layers, href: '/admin/disewa', badgeKey: 'disewa', badgeColor: 'blue' },
        { label: t('admin.payments'), icon: CreditCard, href: '/admin/payments', badgeKey: 'payments', badgeColor: 'red' },
        { label: 'Pengembalian Barang', icon: RotateCcw, href: '/admin/pengembalian', badgeKey: 'pengembalian', badgeColor: 'orange' },
        { label: 'Refund Deposit', icon: Wallet, href: '/admin/deposit-refund', badgeKey: 'deposit', badgeColor: 'orange' },
      ],
    },
    {
      label: 'Verifikasi',
      items: [
        { label: t('admin.ktpVerification'), icon: Shield, href: '/admin/ktp-verifikasi', badgeKey: 'verifikasi', badgeColor: 'red' },
      ],
    },
  ]
}

/*
 * 🔴 Red    = Butuh Tindakan Segera (pembayaran pending, verifikasi KTP menunggu)
 * 🟠 Orange = Perlu Perhatian (barang pending approval, pengembalian, refund deposit)
 * 🔵 Blue   = Sedang Aktif / Proses Berjalan (transaksi aktif, pengiriman, barang disewa)
 * 🟢 Emerald = Informasi Data (jumlah user terdaftar)
 */
const BADGE_STYLES = {
  red:     'bg-red-500 text-white shadow-red-500/30',
  orange:  'bg-amber-500 text-white shadow-amber-500/30',
  blue:    'bg-blue-500 text-white shadow-blue-500/30',
  emerald: 'bg-emerald-500 text-white shadow-emerald-500/30',
}

function NotifBadge({ count, color = 'red' }) {
  if (!count || count <= 0) return null
  const style = BADGE_STYLES[color] || BADGE_STYLES.red
  return (
    <span className={`ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full shadow-sm ${style}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function AdminSidebar() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const menuGroups = useMenuGroups()
  const [badges, setBadges] = useState({})

  const fetchBadges = useCallback(async () => {
    try {
      const response = await adminService.getSidebarBadges()
      const data = response.data?.data || response.data || {}
      setBadges(data)
    } catch (err) {
      console.error('Failed to fetch sidebar badges:', err)
    }
  }, [])

  // Fetch on mount + auto-refresh every 15 seconds
  useEffect(() => {
    fetchBadges()
    const interval = setInterval(fetchBadges, 15000)
    return () => clearInterval(interval)
  }, [fetchBadges])

  // Debounced refresh on navigation (500ms delay to avoid spam)
  useEffect(() => {
    const timer = setTimeout(fetchBadges, 500)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg overflow-hidden">
                  <img src={adminLogo} alt="SiPetualang" className="size-8 object-cover" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SiPetualang</span>
                  <span className="truncate text-xs text-muted-foreground">{t('admin.panel')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                      <Link to={item.href} className="flex items-center w-full">
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badgeKey && <NotifBadge count={badges[item.badgeKey]} color={item.badgeColor} />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  {t('admin.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 size-4" />
                  {t('admin.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function AdminLayout() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const photoUrl = getStorageUrl(user?.profile_photo)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">{t('admin.panel')}</span>
          
          <div className="ml-auto flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            
            {/* --- DROPDOWN PROFILE --- */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative size-8 rounded-full outline-none hover:opacity-80 transition-opacity">
                  <Avatar className="size-8 border">
                    {photoUrl && (
                      <img 
                        src={photoUrl} 
                        alt="profile" 
                        className="aspect-square h-full w-full object-cover" 
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user?.name}</p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full flex items-center">
                    <Users className="mr-2 size-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}