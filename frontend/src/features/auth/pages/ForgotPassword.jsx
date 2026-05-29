import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mountain, ArrowLeft, Mail } from 'lucide-react'
import { authService } from '@/features/auth/services/authService'

export default function ForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

 const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!email) {
    toast.error('Email harus diisi')
    return
  }
  
  setIsSubmitting(true)

  try {
    const response = await authService.forgotPassword(email)
    
    if (response.data?.success) {
      setIsSuccess(true)
      toast.success(response.data.message || 'Link reset telah dikirim')
    } else {
      toast.error(response.data?.message || 'Gagal mengirim link reset')
    }
  } catch (error) {
    console.error('Error:', error)
    const message = error.response?.data?.message || 'Terjadi kesalahan'
    toast.error(message)
  } finally {
    setIsSubmitting(false)
  }
}

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('auth.backToLogin')}
          </Link>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-green-100">
                <Mail className="size-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.checkEmail')}</CardTitle>
              <CardDescription>
                {t('auth.forgotPasswordInstructions')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noEmail')}{' '}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('auth.tryAgain')}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              <Mountain className="size-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword')}</CardTitle>
            <CardDescription>{t('auth.forgotPasswordSubtitle')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                  t('auth.sendResetLink')
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