// frontend/src/features/auth/pages/AuthCallback.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Ambil parameter dari URL
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const userParam = urlParams.get('user')

        console.log('=== GOOGLE LOGIN CALLBACK ===')
        console.log('Token:', token)
        console.log('User Param:', userParam)

        if (!token) {
          console.error('Token tidak ditemukan!')
          navigate('/login')
          return
        }

        // Parse user data
        let userData = {}
        if (userParam) {
          userData = JSON.parse(decodeURIComponent(userParam))
        }

        console.log('Parsed User Data:', userData)

        // Simpan ke localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify({
          id: userData.id_pengguna,
          name: userData.nama,
          email: userData.email,
          peran_pengguna: userData.peran_pengguna,
        }))

        console.log('User saved to localStorage')

        // Redirect berdasarkan role
        const role = userData.peran_pengguna
        console.log('User role:', role)

        if (role === 'admin') {
          console.log('Redirecting to /admin/dashboard')
          toast.success('Login dengan Google berhasil!')
          window.location.href = '/admin/dashboard'
        } else {
          console.log('Redirecting to / (landing page)')
          toast.success('Login dengan Google berhasil!')
          window.location.href = '/'
        }
      } catch (err) {
        console.error('Error in callback:', err)
        setError(err.message)
        toast.error('Login gagal: ' + err.message)
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Login Gagal</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Memproses Login...</h2>
        <p className="text-muted-foreground mt-2">Silakan tunggu sebentar</p>
      </div>
    </div>
  )
}