import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mountain, ArrowLeft, Lock } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'

export default function ResetPassword() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      toast.error(t('auth.invalidResetLink'))
      navigate('/login')
    }
  }, [token, email, navigate, t])

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (password !== confirmPassword) {
    toast.error(t('auth.passwordMismatch'))
    return
  }

  if (password.length < 6) {
    toast.error('Password minimal 6 karakter')
    return
  }

  setIsSubmitting(true)

  try {
    const response = await authService.resetPassword({
      token,
      email,
      password,
      password_confirmation: confirmPassword
    })
    
    console.log('Response:', response)
    console.log('Response.data:', response.data)
    
    // PAKAI response.data, BUKAN response
    if (response.data?.success) {
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      toast.success(response.data.message || 'Password berhasil direset')
      
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } else {
      toast.error(response.data?.message || 'Gagal reset password')
    }
  } catch (error) {
    console.error('Error:', error)
    const message = error.response?.data?.message || 'Terjadi kesalahan'
    toast.error(message)
  } finally {
    setIsSubmitting(false)
  }
}
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('auth.backToLogin')}
        </Link>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordSubtitle')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.newPassword')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('auth.processing')}
                  </>
                ) : (
                  t('auth.resetPasswordButton')
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t('auth.rememberPassword')}{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('auth.loginNow')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}