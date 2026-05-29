import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Store, ShoppingBag } from 'lucide-react'
import logoMark from '@/assets/beranda/Property-1-LogoMark.png'
import logo from '@/assets/beranda/Logo.png'
import googleIcon from '@/assets/beranda/google.svg'
import { BASE_URL } from '@/services/api'

const DEMO_ACCOUNTS = [
  { label: 'Admin', desc: 'Kelola platform', email: 'admin@sipetualang.com', pw: 'password', icon: Shield, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-500/10 hover:bg-red-500/15 border-red-200/60 dark:border-red-900/40' },
  { label: 'Perental', desc: 'Pemilik barang', email: 'perental@test.com', pw: 'password', icon: Store, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10 hover:bg-blue-500/15 border-blue-200/60 dark:border-blue-900/40' },
  { label: 'Penyewa', desc: 'Sewa barang', email: 'penyewa@test.com', pw: 'password', icon: ShoppingBag, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-200/60 dark:border-emerald-900/40' },
]

export default function Login() {
  const { login, isAuthenticated, role } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        const from = location.state?.from || '/'
        navigate(from, { replace: true })
      }
    }
  }, [isAuthenticated, role, navigate, location])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeDemo, setActiveDemo] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await login(email, password)
      toast.success(t('auth.loginSuccess'))
    } catch (error) {
      const message =
        error.response?.data?.message || t('auth.genericError')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/api/auth/google`
  }

  const fillDemo = (acc, idx) => {
    setEmail(acc.email)
    setPassword(acc.pw)
    setActiveDemo(idx)
    setTimeout(() => setActiveDemo(null), 600)
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
              Platform Rental<br />
              Alat Outdoor<br />
              <span className="text-emerald-200">Terpercaya</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-sm leading-relaxed">
              Sewa peralatan camping, hiking, dan petualangan outdoor dengan mudah dan aman.
            </p>
            <div className="flex items-center gap-4 text-emerald-200/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-400" />
                <span>100+ Alat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-400" />
                <span>50+ Perental</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-400" />
                <span>Terpercaya</span>
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
                <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.loginTitle')}</CardTitle>
                <CardDescription className="mt-1">{t('auth.loginSubtitle')}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">{t('auth.password')}</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline underline-offset-4"
                    >
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
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

                <Button type="submit" className="w-full h-11 font-semibold text-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      {t('auth.processing')}
                    </>
                  ) : (
                    t('auth.loginButton')
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
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
                {t('auth.loginWithGoogle')}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {t('auth.noAccount')}{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {t('auth.registerNow')}
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-[0.15em]">
              Demo Akun — Klik untuk auto-fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc, idx) => {
                const Icon = acc.icon
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc, idx)}
                    className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-200 cursor-pointer ${acc.bg} ${activeDemo === idx ? 'scale-95 ring-2 ring-primary' : 'hover:scale-[1.02]'}`}
                  >
                    <div className={`mx-auto size-7 rounded-lg bg-gradient-to-br ${acc.gradient} flex items-center justify-center mb-1.5`}>
                      <Icon className="size-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold block text-foreground">{acc.label}</span>
                    <span className="text-[8px] text-muted-foreground block truncate">{acc.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
