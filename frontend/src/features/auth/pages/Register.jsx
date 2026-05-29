import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import logoMark from '@/assets/beranda/Property-1-LogoMark.png'
import logo from '@/assets/beranda/Logo.png'
import googleIcon from '@/assets/beranda/google.svg'
import { BASE_URL } from '@/services/api'


export default function Register() {
  const { register, isAuthenticated, role } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nama: '',
    email: '',
    no_telp: '',
    password: '',
    password_confirmation: '',
  })

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    }
  }, [isAuthenticated, role, navigate])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password !== form.password_confirmation) {
      toast.error(t('auth.passwordMismatch'))
      return
    }

    setIsSubmitting(true)

    try {
      await register(form)
      toast.success(t('auth.registerSuccess'))
      navigate('/login')
    } catch (error) {
      const data = error.response?.data
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0]
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        toast.error(data?.message || t('auth.genericError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/api/auth/google`
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Animated gradient background - contrasting greens for visible flow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(-45deg, #022c22, #059669, #0d9488, #064e3b, #14b8a6, #065f46, #10b981, #134e4a)',
            backgroundSize: '300% 300%',
            animation: 'gradient-flow 6s ease infinite',
          }}
        />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Floating animated orbs - larger and more visible */}
        <div
          className="absolute -top-10 -left-10 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'rgba(16, 185, 129, 0.25)', animation: 'orb-float-1 6s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-20 -right-10 w-[350px] h-[350px] rounded-full blur-3xl"
          style={{ background: 'rgba(20, 184, 166, 0.2)', animation: 'orb-float-2 8s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-[250px] h-[250px] rounded-full blur-3xl"
          style={{ background: 'rgba(52, 211, 153, 0.15)', animation: 'orb-float-3 5s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[200px] h-[200px] rounded-full blur-2xl"
          style={{ background: 'rgba(167, 243, 208, 0.1)', animation: 'orb-float-1 7s ease-in-out infinite reverse' }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo area */}
          <div>
            <img src={logo} alt="SiPetualang" className="h-10 drop-shadow-lg" />
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Mulai Petualangan<br />
              Anda Bersama<br />
              <span className="text-emerald-200">SiPetualang</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-sm leading-relaxed">
              Daftar sekarang dan nikmati kemudahan menyewa peralatan outdoor berkualitas.
            </p>
            <div className="space-y-3 text-emerald-200/70 text-sm">
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">✓</div>
                <span>Proses pendaftaran cepat dan mudah</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">✓</div>
                <span>Sewa alat outdoor dari perental terpercaya</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">✓</div>
                <span>Buka toko rental dan jadi mitra kami</span>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <p className="text-emerald-200/50 text-xs">© 2025 SiPetualang. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        {/* Theme + Language toggles */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] space-y-5">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            {t('auth.backToHome')}
          </Link>

          {/* Main Card */}
          <Card className="border-border/40 shadow-2xl shadow-black/5 dark:shadow-black/20">
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30">
                <img src={logoMark} alt="SiPetualang" className="size-8 object-contain" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.registerTitle')}</CardTitle>
                <CardDescription className="mt-1">{t('auth.registerSubtitle')}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Nama */}
                <div className="space-y-1.5">
                  <Label htmlFor="nama" className="text-xs font-semibold">{t('auth.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="nama"
                      type="text"
                      placeholder="Nama lengkap"
                      value={form.nama}
                      onChange={updateField('nama')}
                      required
                      disabled={isSubmitting}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={form.email}
                      onChange={updateField('email')}
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* No Telepon */}
                <div className="space-y-1.5">
                  <Label htmlFor="no_telp" className="text-xs font-semibold">{t('auth.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="no_telp"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={form.no_telp}
                      onChange={updateField('no_telp')}
                      required
                      disabled={isSubmitting}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 karakter"
                      value={form.password}
                      onChange={updateField('password')}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password_confirmation" className="text-xs font-semibold">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password_confirmation"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      value={form.password_confirmation}
                      onChange={updateField('password_confirmation')}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 font-semibold text-sm mt-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {t('auth.processing')}
                    </>
                  ) : (
                    t('auth.registerButton')
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground font-medium">atau</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium"
                onClick={handleGoogleLogin}
              >
                <img src={googleIcon} alt="Google" className="size-4 mr-2" />
                {t('auth.registerWithGoogle')}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-5">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                  {t('auth.loginNow')}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
