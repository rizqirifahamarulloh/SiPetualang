import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ScrollToTop from '@/components/ScrollToTop'
import AuthCallback from '@/features/auth/pages/AuthCallback'

// Pages
import Home from '@/features/landing/pages/Home'
import BarangShow from '@/features/landing/pages/BarangShow';

import SewaAlat from '@/features/landing/pages/SewaAlat'
import TokoPage from '@/features/landing/pages/TokoPage'
import CaraSewa from '@/features/landing/pages/CaraSewa'
import BukaRental from '@/features/landing/pages/BukaRental'
import Login from '@/features/auth/pages/Login'
import Register from '@/features/auth/pages/Register'
import ForgotPassword from '@/features/auth/pages/ForgotPassword'
import ResetPassword from '@/features/auth/pages/ResetPassword'
import AdminLayout from '@/features/admin/components/AdminLayout'
import Dashboard from '@/features/admin/pages/Dashboard'
import Users from '@/features/admin/pages/Users'
import UserDetail from '@/features/admin/pages/UserDetail'
import Revenue from '@/features/admin/pages/Revenue'
import KtpVerification from '@/features/admin/pages/ktp-verifikasi'
import Categories from '@/features/admin/pages/Categories'
import Destinations from '@/features/admin/pages/Destinations'
import Gears from '@/features/admin/pages/Gears'
import Payment from '@/features/admin/pages/Payment'
import ShippingStatus from '@/features/admin/pages/ShippingStatus'
import RentedGears from '@/features/admin/pages/RentedGears'
import AdminPengembalian from '@/features/admin/pages/AdminPengembalian'

// Customer Profile - perbaiki pathnya
import Profile from '@/profile/pages/Profile'
import EditProfile from '@/profile/pages/edit-profile'
import UpdatePassword from '@/profile/pages/update-password'
import DeleteAkun from '@/profile/pages/delete-akun'
import ChatPage from '@/features/customer/pages/chat';
import CartPage from '@/features/customer/pages/cart';
import TransactionsPage from '@/features/customer/pages/transactions';
import VerifikasiCustomer from '@/features/customer/pages/verifikasi';
import DashboardRental from '@/features/bukarental/components/DashboardRental';
import ShippingPage from '@/features/customer/pages/ShippingPage'
import PengembalianPage from '@/features/customer/pages/PengembalianPage'
import TransaksiPage from '@/features/customer/pages/TransaksiPage'

function Unauthorized() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="mt-2 text-muted-foreground">
          Unauthorized access
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/sewa-alat" element={<SewaAlat />} />
                <Route path="/barang/:id" element={<BarangShow />} />
                <Route path="/toko/:id" element={<TokoPage />} />
                <Route path="/cara-sewa" element={<CaraSewa />} />
                <Route path="/buka-rental" element={<BukaRental />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Profile routes — any authenticated user */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/profile/update-password" element={<UpdatePassword />} />
                  <Route path="/profile/delete-akun" element={<DeleteAkun />} />
                </Route>

                {/* Admin routes — admin only */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/users/:id" element={<UserDetail />} />
                    <Route path="/admin/gears" element={<Gears />} />
                    <Route path="/admin/categories" element={<Categories />} />
                    <Route path="/admin/destinations" element={<Destinations />} />
                    <Route path="/admin/payments" element={<Payment />} />
                    <Route path="/admin/ktp-verifikasi" element={<KtpVerification />} />
                    <Route path="/admin/revenue" element={<Revenue />} />
                    <Route path="/admin/transactions" element={<Revenue />} />
                    <Route path="/admin/pengiriman" element={<ShippingStatus />} />
                    <Route path="/admin/disewa" element={<RentedGears />} />
                    <Route path="/admin/pengembalian" element={<AdminPengembalian />} />
                  </Route>
                </Route>

                {/* Customer routes — customer only */}
                <Route element={<ProtectedRoute roles={['customer']} />}>
                  <Route path="/customer/chat" element={<ChatPage />} />
                  <Route path="/customer/cart" element={<CartPage />} />
                  <Route path="/profile/transactions" element={<TransactionsPage />} />
                  <Route path="/customer/transactions" element={<TransactionsPage />} />
                  <Route path="/customer/verification" element={<VerifikasiCustomer />} />
                  <Route path="/rental-dashboard" element={<DashboardRental />} />

                  {/* Fallback routes untuk keselarasan link template */}
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/profile/rentals" element={<TransactionsPage />} />
                  <Route path="/profile/transaksi" element={<TransaksiPage />} />
                  <Route path="/profile/pengiriman" element={<ShippingPage />} />
                  <Route path="/profile/pengembalian" element={<PengembalianPage />} />
                </Route>

                {/* Unauthorized fallback */}
                <Route path="/unauthorized" element={<Unauthorized />} />
              </Routes>
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
      <Analytics />
    </BrowserRouter>
  )
}

export default App