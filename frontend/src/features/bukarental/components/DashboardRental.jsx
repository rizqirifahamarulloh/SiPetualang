import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/features/landing/components/Navbar'
import api, { BASE_URL } from '@/services/api'
import { getStorageUrl } from '@/utils/storageUrl'
import { toast } from 'sonner'
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit, 
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  FileText,
  Upload,
  User,
  ArrowRight,
  TrendingDown,
  Layers,
  Home,
  Send,
  ArrowLeft,
  Loader2,
  Search,
  Store,
  Truck,
  RotateCcw,
  ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import NotificationBell from '@/components/NotificationBell'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardRental() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  
  // States
  const [isActivating, setIsActivating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [unreadChats, setUnreadChats] = useState(0)
  const [localNotifications, setLocalNotifications] = useState([])

  // Mini Chat Popup States
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeChatId, setActiveChatId] = useState(null)
  const [activeChatUser, setActiveChatUser] = useState(null)
  const [chatConversations, setChatConversations] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatSearch, setChatSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)

  const chatEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  
  // Lists
  const [gears, setGears] = useState([])
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [refundRequests, setRefundRequests] = useState([])
  const [loadingGears, setLoadingGears] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [loadingRefunds, setLoadingRefunds] = useState(false)
  
  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedGear, setSelectedGear] = useState(null)
  
  // Add Form State
  const [addForm, setAddForm] = useState({
    nama_barang: '',
    deskripsi: '',
    harga_sewa: '',
    min_durasi_sewa: 1,
    nominal_deposit: '',
    jumlah_stok: '',
    id_kategori: '',
    foto_barang: null,
    metode_penyerahan: 'pickup',
    no_resi_penyerahan: ''
  })
  const [addPhotoPreview, setAddPhotoPreview] = useState(null)
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    nama_barang: '',
    deskripsi: '',
    harga_sewa: '',
    min_durasi_sewa: 1,
    nominal_deposit: '',
    jumlah_stok: '',
    id_kategori: '',
    foto_barang: null,
    metode_penyerahan: 'pickup',
    no_resi_penyerahan: ''
  })
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)

  // Chart Tooltip States
  const [hoveredMonth, setHoveredMonth] = useState(null)
  const [hoveredPie, setHoveredPie] = useState(null)

  // 1. Logika Aktivasi Otomatis & Proteksi Halaman
  useEffect(() => {
    const checkAndActivateRental = async () => {
      if (!user) return
      
      const isApproved = user.is_verified === true || user.verification_status === 'disetujui'
      
      if (user.rental !== 'true') {
        if (isApproved) {
          try {
            setIsActivating(true)
            toast.info('Menyiapkan dashboard rental Anda...')
            
            // Aktifkan rental
            await api.post('/profile/rental')
            
            // Ambil profil terupdate
            const profileRes = await api.get('/profile')
            const updatedUser = { ...user, ...profileRes.data.data }
            
            // Simpan di context dan localStorage
            setUser(updatedUser)
            localStorage.setItem('user', JSON.stringify(updatedUser))
            
            toast.success('Selamat! Fitur Rental Anda telah diaktifkan secara otomatis.')
          } catch (err) {
            console.error('Gagal mengaktifkan rental:', err)
            toast.error('Gagal mengaktifkan dashboard rental.')
            navigate('/buka-rental')
          } finally {
            setIsActivating(false)
          }
        } else {
          // Belum diverifikasi, arahkan ke halaman pendaftaran
          navigate('/buka-rental', { replace: true })
        }
      }
    }

    checkAndActivateRental()
  }, [user, navigate, setUser])

  // 2. Fetch Data dari Database
  const fetchGears = async () => {
    try {
      setLoadingGears(true)
      const res = await api.get('/customer/rental/my-barang')
      if (res.data.success) {
        setGears(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil data barang:', err)
      toast.error('Gagal memuat daftar barang.')
    } finally {
      setLoadingGears(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const res = await api.get('/customer/transaksi/sebagai-pemilik')
      if (res.data.success) {
        setTransactions(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil transaksi:', err)
      toast.error('Gagal memuat riwayat penyewaan masuk.')
    } finally {
      setLoadingTransactions(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/kategori')
      if (res.data.status === 'success') {
        setCategories(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal memuat kategori:', err)
    }
  }

  const fetchRefundRequests = async () => {
    try {
      setLoadingRefunds(true)
      const res = await api.get('/customer/pengembalian/sebagai-pemilik')
      if (res.data.status === 'success') {
        setRefundRequests(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil data refund:', err)
    } finally {
      setLoadingRefunds(false)
    }
  }

  const fetchUnreadChats = async () => {
    try {
      const res = await api.get('/customer/chat/conversations')
      const convs = res.data.data || []
      const totalUnread = convs.reduce((sum, item) => sum + (item.unread_count || 0), 0)
      setUnreadChats(totalUnread)
    } catch (err) {
      console.error('Gagal mengambil data chat:', err)
    }
  }

  // Mini Chat Helper: Get other user in a conversation
  const getOtherUserInConv = (conv) => {
    if (!user) return null
    const myId = user.id || user.id_pengguna
    return Number(conv.id_user_a) === Number(myId) ? conv.user_b : conv.user_a
  }

  // Mini Chat Helper: Fetch list of conversations
  const fetchConversationsList = async () => {
    try {
      const res = await api.get('/customer/chat/conversations')
      setChatConversations(res.data.data || [])
    } catch (err) {
      console.error("Gagal memuat percakapan:", err)
    }
  }

  // Mini Chat Helper: Fetch messages in a conversation
  const fetchChatMessages = async (conversationId, silent = false) => {
    if (!conversationId) return
    try {
      if (!silent) setChatLoading(true)
      const res = await api.get(`/customer/chat/messages/${conversationId}`)
      const messagesData = res.data.data?.messages || []
      setChatMessages(messagesData)
      
      // Auto scroll
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error("Gagal memuat pesan:", err)
    } finally {
      if (!silent) setChatLoading(false)
    }
  }
  // Mini Chat Helper: Open a specific conversation
  const handleOpenConversation = (conv) => {
    const otherUser = getOtherUserInConv(conv)
    setActiveChatId(conv.id_conversation)
    setActiveChatUser(otherUser)
    fetchChatMessages(conv.id_conversation)
  }

  // Mini Chat Helper: Instantly start/open chat with customer from anywhere
  const handleChatWithCustomer = async (customerId, customerName) => {
    try {
      toast.info(`Membuka obrolan dengan ${customerName}...`)
      const res = await api.post(`/customer/chat/conversation/${customerId}`)
      const conv = res.data.data
      
      if (conv) {
        setIsChatOpen(true)
        setActiveChatId(conv.id_conversation)
        
        const otherUser = Number(conv.id_user_a) === Number(customerId) ? conv.user_a : conv.user_b
        setActiveChatUser(otherUser || { nama: customerName, id_pengguna: customerId })
        
        await fetchChatMessages(conv.id_conversation)
        toast.success(`Terhubung dengan ${customerName}`)
      }
    } catch (err) {
      console.error("Gagal memulai chat dengan customer:", err)
      toast.error("Gagal membuka obrolan.")
    }
  }

  // Mini Chat Helper: Send quick reply message
  const handleSendQuickMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatId || sendingMsg) return

    const text = chatInput.trim()
    setChatInput('')
    setSendingMsg(true)

    // Append local temporary message
    const myId = user.id || user.id_pengguna
    const tempMsg = {
      id_message: Date.now(),
      id_sender: myId,
      message: text,
      created_at: new Date().toISOString(),
      is_read: false
    }
    setChatMessages(prev => [...prev, tempMsg])
    
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    try {
      await api.post('/customer/chat/message', {
        id_conversation: activeChatId,
        message: text
      })
      await fetchChatMessages(activeChatId, true)
      fetchConversationsList()
      fetchUnreadChats()
    } catch (err) {
      console.error("Gagal mengirim pesan:", err)
      toast.error("Gagal mengirim pesan sewa.")
      setChatMessages(prev => prev.filter(m => m.id_message !== tempMsg.id_message))
    } finally {
      setSendingMsg(false)
    }
  }

  // Click Outside Hook to close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
        // Jangan tutup jika klik terjadi pada tombol chat dengan customer
        if (event.target.closest('.chat-trigger-btn') || event.target.classList.contains('chat-trigger-btn')) {
          return
        }
        setIsChatOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [chatContainerRef])

  // Polling Hook for active messages/conversations list (every 5 seconds)
  useEffect(() => {
    if (!isChatOpen) return

    const interval = setInterval(() => {
      fetchConversationsList()
      if (activeChatId) {
        fetchChatMessages(activeChatId, true)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isChatOpen, activeChatId])

  // Filter conversations list based on search bar
  const filteredChatConvs = useMemo(() => {
    if (!chatSearch.trim()) return chatConversations
    return chatConversations.filter(conv => {
      const otherUser = getOtherUserInConv(conv)
      return otherUser?.nama?.toLowerCase().includes(chatSearch.toLowerCase())
    })
  }, [chatConversations, chatSearch, user])

  useEffect(() => {
    if (user && user.rental === 'true') {
      fetchGears()
      fetchTransactions()
      fetchCategories()
      fetchUnreadChats()
      fetchRefundRequests()
      
      // Polling chat unread badge setiap 15 detik
      const chatInterval = setInterval(fetchUnreadChats, 15000)
      return () => clearInterval(chatInterval)
    }
  }, [user])

  // 3. Hitung Statistik Dinamis dari Database
  const stats = useMemo(() => {
    const totalGears = gears.length
    
    // Total Pendapatan dari transaksi sukses
    const successfulTrans = transactions.filter(t => t.status_pembayaran === 'sukses')
    const totalRevenue = successfulTrans.reduce((sum, t) => sum + Number(t.pendapatan_pemilik || 0), 0)
    
    // Total Refund yang sudah dikonfirmasi
    const totalRefund = refundRequests
      .filter(r => r.status === 'disetujui' && (r.status_refund === 'sudah_refund' || r.status_refund === 'proses_refund'))
      .reduce((sum, r) => sum + Number(r.jumlah_refund || 0), 0)
    
    const netRevenue = totalRevenue - totalRefund
    
    const activeRentals = transactions.filter(t => t.status_sewa === 'sedang_disewa').length
    const criticalStock = gears.filter(g => g.jumlah_stok < 5).length
    const pendingApproval = gears.filter(g => g.status_approval === 'pending').length
    const activeRefunds = refundRequests.filter(r => r.status === 'disetujui' && r.status_refund !== 'sudah_refund').length
    
    return {
      totalGears,
      totalRevenue,
      totalRefund,
      netRevenue,
      activeRentals,
      criticalStock,
      pendingApproval,
      activeRefunds,
      totalRefundCount: refundRequests.length
    }
  }, [gears, transactions, refundRequests])

  // Generate local notifications for critical stock and new rentals
  useEffect(() => {
    const newNotifications = []
    const now = new Date().toISOString()

    // Notification for critical stock (stock < 5)
    if (stats.criticalStock > 0) {
      const criticalItems = gears.filter(g => g.jumlah_stok < 5)
      criticalItems.forEach((item, idx) => {
        const severityLevel = item.jumlah_stok <= 0 ? 'danger' : (item.jumlah_stok <= 2 ? 'danger' : 'warning')
        const stockLabel = item.jumlah_stok <= 0 ? 'HABIS' : `tinggal ${item.jumlah_stok} stok`
        newNotifications.push({
          id_notifikasi: `local-stock-${item.id_barang}`,
          type: 'stock_warning',
          severity: severityLevel,
          title: item.jumlah_stok <= 0 ? `🚨 Stok Habis: ${item.nama_barang}` : `⚠️ Stok Kritis: ${item.nama_barang}`,
          message: `Barang "${item.nama_barang}" ${stockLabel}. Segera tambahkan stok untuk menghindari kehabisan.`,
          created_at: now,
          is_read: false
        })
      })
    }

    // Notification for new incoming rentals (dibayar but not yet disewa)
    const incomingRentals = transactions.filter(t => 
      t.status_pembayaran === 'sukses' && 
      t.status_sewa === 'dibayar'
    )
    if (incomingRentals.length > 0) {
      const newestOrder = incomingRentals.reduce((latest, t) => {
        const tDate = new Date(t.created_at || t.updated_at || now)
        return tDate > new Date(latest.created_at || latest.updated_at || now) ? t : latest
      }, incomingRentals[0])

      newNotifications.push({
        id_notifikasi: 'local-incoming-rentals',
        type: 'transaction',
        severity: 'info',
        title: `📦 ${incomingRentals.length} Penyewaan Baru Masuk`,
        message: `Anda memiliki ${incomingRentals.length} penyewaan yang sudah dibayar dan siap diambil customer.`,
        created_at: newestOrder.created_at || newestOrder.updated_at || now,
        is_read: false
      })
    }

    setLocalNotifications(newNotifications)
  }, [stats, gears, transactions])

  // 4. Form Actions (CRUD Barang)
  const handleAddPhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAddForm(prev => ({ ...prev, foto_barang: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setAddPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditForm(prev => ({ ...prev, foto_barang: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    
    if (!addForm.nama_barang || !addForm.harga_sewa || !addForm.jumlah_stok || !addForm.id_kategori) {
      toast.error('Harap isi semua kolom wajib!')
      return
    }

    try {
      const formData = new FormData()
      formData.append('nama_barang', addForm.nama_barang)
      formData.append('deskripsi', addForm.deskripsi)
      formData.append('harga_sewa', addForm.harga_sewa)
      formData.append('min_durasi_sewa', addForm.min_durasi_sewa || 1)
      formData.append('nominal_deposit', addForm.nominal_deposit || 0)
      formData.append('jumlah_stok', addForm.jumlah_stok)
      formData.append('id_kategori', addForm.id_kategori)
      formData.append('metode_penyerahan', addForm.metode_penyerahan || 'pickup')
      if (addForm.no_resi_penyerahan) {
        formData.append('no_resi_penyerahan', addForm.no_resi_penyerahan)
      }
      if (addForm.foto_barang) {
        formData.append('foto_barang', addForm.foto_barang)
      }

      const res = await api.post('/customer/rental/barang', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        toast.success('Barang berhasil diajukan! Menunggu persetujuan admin.')
        setAddModalOpen(false)
        setAddForm({
          nama_barang: '',
          deskripsi: '',
          harga_sewa: '',
          min_durasi_sewa: 1,
          nominal_deposit: '',
          jumlah_stok: '',
          id_kategori: '',
          foto_barang: null,
          metode_penyerahan: 'pickup',
          no_resi_penyerahan: ''
        })
        setAddPhotoPreview(null)
        fetchGears()
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal mengajukan barang.'
      toast.error(msg)
    }
  }

  const openEditModal = (gear) => {
    setSelectedGear(gear)
    setEditForm({
      nama_barang: gear.nama_barang || '',
      deskripsi: gear.deskripsi || '',
      harga_sewa: gear.harga_sewa || '',
      min_durasi_sewa: gear.min_durasi_sewa || 1,
      nominal_deposit: gear.nominal_deposit || '',
      jumlah_stok: gear.jumlah_stok || '',
      id_kategori: gear.id_kategori || '',
      foto_barang: null,
      metode_penyerahan: gear.metode_penyerahan || 'pickup',
      no_resi_penyerahan: gear.no_resi_penyerahan || ''
    })
    if (gear.foto_barang) {
      setEditPhotoPreview(
        gear.foto_barang.startsWith('http') 
          ? gear.foto_barang 
          : `${BASE_URL}/storage/${gear.foto_barang}`
      )
    } else {
      setEditPhotoPreview(null)
    }
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    if (!editForm.nama_barang || !editForm.harga_sewa || !editForm.id_kategori) {
      toast.error('Harap isi semua kolom wajib!')
      return
    }

    // Validate stock is non-negative
    if (editForm.jumlah_stok === '' || Number(editForm.jumlah_stok) < 0) {
      toast.error('Jumlah stok tidak boleh kosong atau negatif!')
      return
    }

    try {
      const formData = new FormData()
      formData.append('_method', 'PUT')
      formData.append('nama_barang', editForm.nama_barang)
      formData.append('deskripsi', editForm.deskripsi)
      formData.append('harga_sewa', editForm.harga_sewa)
      formData.append('min_durasi_sewa', editForm.min_durasi_sewa || 1)
      formData.append('nominal_deposit', editForm.nominal_deposit || 0)
      formData.append('jumlah_stok', editForm.jumlah_stok)
      formData.append('id_kategori', editForm.id_kategori)
      formData.append('metode_penyerahan', editForm.metode_penyerahan || 'pickup')
      if (editForm.no_resi_penyerahan) {
        formData.append('no_resi_penyerahan', editForm.no_resi_penyerahan)
      }
      if (editForm.foto_barang) {
        formData.append('foto_barang', editForm.foto_barang)
      }

      const res = await api.post(`/customer/rental/barang/${selectedGear.id_barang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        // Show appropriate message based on backend response
        const successMsg = res.data.message || 'Barang berhasil diperbarui!'
        if (successMsg.includes('ditinjau ulang')) {
          toast.warning(successMsg, { duration: 5000 })
        } else {
          toast.success(successMsg)
        }
        setEditModalOpen(false)
        fetchGears()
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memperbarui barang.'
      toast.error(msg)
    }
  }

  const handleDeleteGear = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus barang ini?')) return

    try {
      const res = await api.delete(`/customer/rental/barang/${id}`)
      if (res.data.success) {
        toast.success('Barang berhasil dihapus!')
        fetchGears()
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menghapus barang.'
      toast.error(msg)
    }
  }

  // 5. Update Status Penyewaan Masuk
  const handleUpdateStatusSewa = async (trxId, newStatus) => {
    try {
      const res = await api.put(`/customer/transaksi/${trxId}/status`, {
        status_sewa: newStatus
      })
      if (res.data.success) {
        toast.success(`Status sewa berhasil diperbarui menjadi ${newStatus.replace('_', ' ')}!`)
        fetchTransactions()
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengubah status sewa.')
    }
  }

  // Helper formatting rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // helper untuk URL foto barang
  const getGearPhoto = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${BASE_URL}/storage/${path}`
  }

  // 6. Data Generator & SVG untuk Chart Dinamis
  const chartData = useMemo(() => {
    // Generate data 6 bulan terakhir secara dinamis
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const result = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push({
        monthName: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        value: 0,
        refund: 0
      })
    }

    // Isi data dari transaksi sukses
    transactions.forEach(t => {
      if (t.status_pembayaran === 'sukses') {
        const trxDate = new Date(t.created_at || t.updated_at)
        const trxMonth = trxDate.getMonth()
        const trxYear = trxDate.getFullYear()

        const match = result.find(r => r.monthIndex === trxMonth && r.year === trxYear)
        if (match) {
          match.value += Number(t.pendapatan_pemilik || 0)
        }
      }
    })

    // Isi data refund per bulan
    refundRequests.forEach(r => {
      if (r.status === 'disetujui') {
        const refundDate = new Date(r.created_at || r.updated_at)
        const refMonth = refundDate.getMonth()
        const refYear = refundDate.getFullYear()

        const match = result.find(m => m.monthIndex === refMonth && m.year === refYear)
        if (match) {
          match.refund += Number(r.jumlah_refund || 0)
        }
      }
    })

    return result
  }, [transactions, refundRequests])

  const pieData = useMemo(() => {
    const statuses = {
      'Selesai': 0,
      'Sedang Disewa': 0,
      'Menunggu': 0,
      'Dibatalkan': 0
    }

    transactions.forEach(t => {
      if (t.status_sewa === 'selesai') statuses['Selesai']++
      else if (t.status_sewa === 'sedang_disewa') statuses['Sedang Disewa']++
      else if (t.status_sewa === 'menunggu_pembayaran') statuses['Menunggu']++
      else if (t.status_sewa === 'dibatalkan') statuses['Dibatalkan']++
    })

    const colors = {
      'Selesai': '#10b981', // green
      'Sedang Disewa': '#3b82f6', // blue
      'Menunggu': '#f59e0b', // amber
      'Dibatalkan': '#ef4444' // red
    }

    return Object.keys(statuses).map(key => ({
      name: key,
      count: statuses[key],
      color: colors[key]
    })).filter(item => item.count > 0)
  }, [transactions])

  // Hitung titik koordinat SVG Area Chart
  const svgLinePoints = useMemo(() => {
    if (chartData.length === 0) return []
    const maxVal = Math.max(...chartData.map(d => d.value), ...chartData.map(d => d.refund), 100000)
    const width = 500
    const height = 150
    const padding = 20

    const points = chartData.map((d, i) => {
      const x = padding + (i * (width - padding * 2) / (chartData.length - 1))
      const y = height - padding - (d.value * (height - padding * 2) / maxVal)
      return { x, y }
    })

    return points
  }, [chartData])

  // Hitung titik koordinat SVG Refund Line
  const svgRefundPoints = useMemo(() => {
    if (chartData.length === 0) return []
    const hasRefund = chartData.some(d => d.refund > 0)
    if (!hasRefund) return []

    const maxVal = Math.max(...chartData.map(d => d.value), ...chartData.map(d => d.refund), 100000)
    const width = 500
    const height = 150
    const padding = 20

    const points = chartData.map((d, i) => {
      const x = padding + (i * (width - padding * 2) / (chartData.length - 1))
      const y = height - padding - (d.refund * (height - padding * 2) / maxVal)
      return { x, y, hasRefund: d.refund > 0 }
    })

    return points
  }, [chartData])

  // Pie chart calculation
  const totalPieCount = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.count, 0)
  }, [pieData])

  // Generate pie slices
  const pieSlices = useMemo(() => {
    let accumulatedAngle = 0
    return pieData.map(item => {
      const percentage = item.count / totalPieCount
      const angle = percentage * 360
      const startAngle = accumulatedAngle
      const endAngle = accumulatedAngle + angle
      accumulatedAngle += angle

      // Polar to cartesian
      const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        }
      }

      const getArcPath = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle)
        const end = polarToCartesian(x, y, radius, startAngle)
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
        return [
          "M", start.x, start.y, 
          "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
          "L", x, y,
          "Z"
        ].join(" ")
      }

      const path = getArcPath(100, 100, 80, startAngle, endAngle)
      return {
        ...item,
        path,
        percentage
      }
    })
  }, [pieData, totalPieCount])

  // Render Loader jika sedang aktivasi
  if (isActivating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="relative">
          <div className="size-20 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <Layers className="size-8 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold mt-6 mb-2">Mengaktifkan Akun Perental</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Harap tunggu, kami sedang mengonfigurasi profil dan hak akses kemitraan rental Anda secara dinamis...
        </p>
      </div>
    )
  }

  if (user?.rental !== 'true') return null

  return (
    <>
      {/* Top Navbar with integrated notification + chat */}
      <Navbar rentalMode={true} additionalNotifications={localNotifications} forceScrolled={true} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/10 pt-20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          
          {/* Header Dashboard Perental */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Kemitraan Perental
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">Dashboard Rental</h1>
              <p className="text-sm text-muted-foreground">
                Kelola barang sewa, transaksi customer, dan pantau performa bisnis Anda secara dinamis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Kemitraan */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border bg-card dark:bg-slate-900 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                  <Avatar className="size-20 mx-auto ring-4 ring-white/20 mb-3">
                    <AvatarImage src={getStorageUrl(user.profile_photo)} />
                    <AvatarFallback className="text-2xl bg-white/10 text-white">
                      {user.nama?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg leading-tight truncate">{user.nama}</h3>
                  <p className="text-xs text-emerald-100 mt-1 truncate">{user.email}</p>
                </div>
                
                <CardContent className="p-4 space-y-1">
                  <Button 
                    onClick={() => setActiveTab('overview')}
                    variant={activeTab === 'overview' ? 'secondary' : 'ghost'} 
                    className={`w-full justify-start rounded-xl font-medium ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <TrendingUp className="size-4 mr-3" />
                    Ringkasan Performa
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('gears')}
                    variant={activeTab === 'gears' ? 'secondary' : 'ghost'} 
                    className={`w-full justify-start rounded-xl font-medium ${activeTab === 'gears' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <Package className="size-4 mr-3" />
                    Kelola Barang
                    {stats.criticalStock > 0 && (
                      <Badge className="ml-auto bg-amber-500 text-white hover:bg-amber-500 scale-90">{stats.criticalStock} Stok Tipis</Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('transactions')}
                    variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} 
                    className={`w-full justify-start rounded-xl font-medium ${activeTab === 'transactions' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <ShoppingBag className="size-4 mr-3" />
                    Penyewaan Masuk
                    {stats.activeRentals > 0 && (
                      <Badge className="ml-auto bg-blue-500 text-white hover:bg-blue-500 scale-90">{stats.activeRentals} Aktif</Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('refunds')}
                    variant={activeTab === 'refunds' ? 'secondary' : 'ghost'} 
                    className={`w-full justify-start rounded-xl font-medium ${activeTab === 'refunds' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <RotateCcw className="size-4 mr-3" />
                    Refund Barang
                    {stats.activeRefunds > 0 && (
                      <Badge className="ml-auto bg-rose-500 text-white hover:bg-rose-500 scale-90">{stats.activeRefunds} Proses</Badge>
                    )}
                  </Button>
                  
                  <div className="border-t my-4" />
                  
                  <Button 
                    onClick={() => navigate('/')} 
                    variant="ghost" 
                    className="w-full justify-start rounded-xl text-gray-500 hover:text-gray-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Home className="size-4 mr-3" />
                    Kembali ke Beranda
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Content Area */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Grid Statistik */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Total Barang */}
                    <Card className="shadow-sm border border-border rounded-2xl bg-card hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">
                            Total Alat
                          </p>
                          <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight">
                            {stats.totalGears} <span className="text-xs font-semibold text-muted-foreground">Item</span>
                          </h4>
                          {stats.pendingApproval > 0 ? (
                            <span className="text-[10px] text-amber-500 flex items-center gap-1 font-bold mt-2 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full w-fit">
                              <Clock className="size-3" /> {stats.pendingApproval} Pending
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/10 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle className="size-3" /> Semua Aktif
                            </span>
                          )}
                        </div>
                        <div className="size-12 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950/40 dark:to-emerald-950/20 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition duration-300">
                          <Package className="size-5" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Pendapatan */}
                    <Card className="shadow-sm border border-border rounded-2xl bg-card hover:-translate-y-1 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">
                            Earning Bersih
                          </p>
                          <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {formatRupiah(stats.netRevenue)}
                          </h4>
                          {stats.totalRefund > 0 ? (
                            <span className="text-[10px] text-rose-500 flex items-center gap-1 font-bold mt-2 bg-rose-50 dark:bg-rose-950/10 px-2 py-0.5 rounded-full w-fit">
                              <TrendingDown className="size-3" /> Refund: -{formatRupiah(stats.totalRefund)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-bold mt-2 bg-teal-50 dark:bg-teal-950/10 px-2 py-0.5 rounded-full w-fit">
                              <TrendingUp className="size-3" /> Bagian Owner (80%)
                            </span>
                          )}
                        </div>
                        <div className="size-12 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-950/40 dark:to-teal-950/20 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition duration-300">
                          <DollarSign className="size-5" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transaksi Aktif */}
                    <Card className="shadow-sm border border-border rounded-2xl bg-card hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">
                            Sewa Aktif
                          </p>
                          <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight">
                            {stats.activeRentals} <span className="text-xs font-semibold text-muted-foreground">Order</span>
                          </h4>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-bold mt-2 bg-indigo-50 dark:bg-indigo-950/10 px-2 py-0.5 rounded-full w-fit">
                            Sedang Digunakan
                          </span>
                        </div>
                        <div className="size-12 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-950/20 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition duration-300">
                          <ShoppingBag className="size-5" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stok Kritis */}
                    <Card className="shadow-sm border border-border rounded-2xl bg-card hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 group">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">
                            Stok Kritis
                          </p>
                          <h4 className="text-2xl font-black text-foreground dark:text-white tracking-tight">
                            {stats.criticalStock} <span className="text-xs font-semibold text-muted-foreground">Item</span>
                          </h4>
                          {stats.criticalStock > 0 ? (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold mt-2 bg-rose-50 dark:bg-rose-950/10 px-2 py-0.5 rounded-full w-fit animate-pulse">
                              <AlertCircle className="size-3" /> Butuh Restok
                            </span>
                          ) : (
                            <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 font-bold mt-2 bg-green-50 dark:bg-green-950/10 px-2 py-0.5 rounded-full w-fit">
                              <CheckCircle className="size-3" /> Stok Aman
                            </span>
                          )}
                        </div>
                        <div className={`size-12 bg-gradient-to-br ${stats.criticalStock > 0 ? 'from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-950/20 text-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 text-muted-foreground'} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition duration-300`}>
                          <AlertCircle className="size-5" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Grid Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SVG Line / Area Chart Dinamis */}
                    <Card className="lg:col-span-2 shadow-sm border rounded-2xl bg-card overflow-hidden">
                      <CardHeader className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <CardTitle className="text-lg font-bold">Tren Pendapatan Bulanan</CardTitle>
                            <CardDescription>Visualisasi earning & refund perental selama 6 bulan terakhir.</CardDescription>
                          </div>
                          {/* Legend */}
                          <div className="flex items-center gap-4 text-[11px] font-semibold">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-[3px] rounded-full bg-emerald-500" />
                              <span className="text-muted-foreground">Pendapatan</span>
                            </div>
                            {svgRefundPoints.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-[3px] rounded-full bg-red-500" style={{ borderTop: '2px dashed #ef4444' }} />
                                <span className="text-red-500">Refund</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        {transactions.length === 0 ? (
                          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                            Belum ada riwayat transaksi masuk untuk diplot.
                          </div>
                        ) : (
                          <div className="relative">
                            <svg className="w-full h-[200px]" viewBox="0 0 500 150" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="gradient-refund" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              
                              {/* Grid lines */}
                              <line x1="20" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                              <line x1="20" y1="65" x2="480" y2="65" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                              <line x1="20" y1="110" x2="480" y2="110" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                              <line x1="20" y1="130" x2="480" y2="130" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-slate-700" />

                              {/* Earning area fill */}
                              {svgLinePoints.length > 0 && (
                                <path 
                                  d={`${svgLinePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')} L ${svgLinePoints[svgLinePoints.length - 1].x} 130 L ${svgLinePoints[0].x} 130 Z`} 
                                  fill="url(#gradient-area)" 
                                />
                              )}

                              {/* Earning line */}
                              {svgLinePoints.length > 0 && (
                                <path 
                                  d={svgLinePoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')} 
                                  fill="none" 
                                  stroke="#10b981" 
                                  strokeWidth="3.5" 
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {/* Refund area fill */}
                              {svgRefundPoints.length > 0 && (
                                <path 
                                  d={`${svgRefundPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')} L ${svgRefundPoints[svgRefundPoints.length - 1].x} 130 L ${svgRefundPoints[0].x} 130 Z`} 
                                  fill="url(#gradient-refund)" 
                                />
                              )}

                              {/* Refund line (dashed) */}
                              {svgRefundPoints.length > 0 && (
                                <path 
                                  d={svgRefundPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')} 
                                  fill="none" 
                                  stroke="#ef4444" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeDasharray="6 4"
                                />
                              )}

                              {/* Earning dots */}
                              {svgLinePoints.map((p, idx) => (
                                <circle 
                                  key={`earn-${idx}`}
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="5" 
                                  fill="#ffffff" 
                                  stroke="#10b981" 
                                  strokeWidth="2.5" 
                                  className="cursor-pointer transition dark:fill-slate-900"
                                  onMouseEnter={() => setHoveredMonth(idx)}
                                  onMouseLeave={() => setHoveredMonth(null)}
                                />
                              ))}

                              {/* Refund dots (only on months with refund) */}
                              {svgRefundPoints.map((p, idx) => (
                                p.hasRefund && (
                                  <circle 
                                    key={`ref-${idx}`}
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="4.5" 
                                    fill="#ef4444" 
                                    stroke="#ffffff" 
                                    strokeWidth="2" 
                                    className="cursor-pointer dark:stroke-slate-900"
                                    onMouseEnter={() => setHoveredMonth(idx)}
                                    onMouseLeave={() => setHoveredMonth(null)}
                                  />
                                )
                              ))}
                            </svg>

                            {/* Month labels */}
                            <div className="flex justify-between px-5 mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {chartData.map((d, i) => (
                                <span key={i} className={hoveredMonth === i ? 'text-emerald-600 font-extrabold' : ''}>
                                  {d.monthName}
                                </span>
                              ))}
                            </div>

                            {/* Real-time Tooltip Box */}
                            {hoveredMonth !== null && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white rounded-xl px-4 py-2.5 shadow-xl border border-slate-800 flex flex-col text-xs font-semibold items-center z-10 animate-in fade-in zoom-in-95 duration-150 min-w-[140px]">
                                <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">{chartData[hoveredMonth].monthName} {chartData[hoveredMonth].year}</span>
                                <span className="text-emerald-400 mt-1 text-sm font-extrabold">{formatRupiah(chartData[hoveredMonth].value)}</span>
                                {chartData[hoveredMonth].refund > 0 && (
                                  <span className="text-red-400 mt-0.5 text-xs font-bold flex items-center gap-1">
                                    <RotateCcw className="size-3" /> -{formatRupiah(chartData[hoveredMonth].refund)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* SVG Circular Doughnut Chart Dinamis */}
                    <Card className="shadow-sm border rounded-2xl bg-card overflow-hidden flex flex-col">
                      <CardHeader className="p-6">
                        <CardTitle className="text-lg font-bold">Status Transaksi</CardTitle>
                        <CardDescription>Proporsi status penyewaan saat ini di database.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-center">
                        {transactions.length === 0 ? (
                          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                            Belum ada statistik transaksi.
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="relative size-[160px]">
                              <svg className="size-full" viewBox="0 0 200 200">
                                {/* Doughnut slices */}
                                {pieSlices.map((slice, idx) => (
                                  <path 
                                    key={idx}
                                    d={slice.path} 
                                    fill={slice.color}
                                    className="cursor-pointer transition duration-300 hover:opacity-90"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    style={{
                                      transform: hoveredPie === idx ? 'scale(1.04)' : 'scale(1)',
                                      transformOrigin: '100px 100px',
                                      transition: 'all 0.3s ease',
                                      color: 'var(--card)'
                                    }}
                                    onMouseEnter={() => setHoveredPie(idx)}
                                    onMouseLeave={() => setHoveredPie(null)}
                                  />
                                ))}

                                {/* Center cutout for Doughnut effect */}
                                <circle cx="100" cy="100" r="50" className="fill-card" />
                              </svg>

                              {/* Center text of Doughnut */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                                <p className="text-2xl font-black">{totalPieCount}</p>
                                <span className="text-[9px] font-semibold text-muted-foreground">Order</span>
                              </div>
                            </div>

                            {/* Legends with values */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs font-semibold w-full px-2">
                              {pieSlices.map((slice, idx) => (
                                <div 
                                  key={idx} 
                                  className={`flex items-center gap-2 cursor-pointer p-1 rounded-lg transition ${hoveredPie === idx ? 'bg-muted' : ''}`}
                                  onMouseEnter={() => setHoveredPie(idx)}
                                  onMouseLeave={() => setHoveredPie(null)}
                                >
                                  <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                                  <span className="truncate text-muted-foreground">{slice.name}</span>
                                  <span className="ml-auto font-bold">{slice.count}</span>
                                </div>
                              ))}
                            </div>

                            {/* Refund summary below pie */}
                            {stats.totalRefund > 0 && (
                              <div className="mt-4 w-full px-2 pt-3 border-t border-border">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                                    <RotateCcw className="size-3" /> Refund
                                  </span>
                                  <span className="font-bold text-red-500">-{formatRupiah(stats.totalRefund)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1">
                                  <span className="text-muted-foreground font-medium">Earning Bersih</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(stats.netRevenue)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transaksi Terbaru di Ringkasan */}
                  <Card className="shadow-sm border rounded-2xl bg-card dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="p-6 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold">Aktivitas Sewa Terbaru</CardTitle>
                        <CardDescription>Customer yang baru mengajukan pesanan penyewaan alat Anda.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')} className="rounded-xl gap-1">
                        Semua Penyewaan <ArrowRight className="size-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      {transactions.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          Belum ada transaksi sewa masuk dari customer lain.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-bold">Penyewa</TableHead>
                                <TableHead className="font-bold">Barang Outdoor</TableHead>
                                <TableHead className="font-bold">Durasi Sewa</TableHead>
                                <TableHead className="font-bold">Earning Anda</TableHead>
                                <TableHead className="font-bold text-center">Status Pembayaran</TableHead>
                                <TableHead className="font-bold text-center">Status Sewa</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.slice(0, 4).map((trx) => (
                                <TableRow key={trx.id_transaksi}>
                                  <TableCell className="font-semibold text-gray-800 dark:text-gray-200">
                                    <button 
                                      onClick={() => handleChatWithCustomer(trx.id_penyewa, trx.penyewa?.nama)}
                                      className="chat-trigger-btn hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline text-left font-bold cursor-pointer"
                                      title={`Chat dengan ${trx.penyewa?.nama || 'Customer'}`}
                                    >
                                      {trx.penyewa?.nama || 'Customer'}
                                    </button>
                                  </TableCell>
                                  <TableCell>
                                    {trx.detail_transaksi && trx.detail_transaksi.length > 0 ? (
                                      <div className="space-y-0.5">
                                        {trx.detail_transaksi.map((d, i) => (
                                          <div key={d.id_detail || i} className="text-xs">
                                            {d.nama_barang || d.barang?.nama_barang} ({d.jumlah_pinjam}x)
                                          </div>
                                        ))}
                                      </div>
                                    ) : trx.nama_barang}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    <div className="font-medium">{trx.total_hari} Hari</div>
                                    <div className="text-[10px] text-muted-foreground">{trx.tanggal_mulai} s/d {trx.tanggal_selesai}</div>
                                  </TableCell>
                                  <TableCell className="font-bold text-emerald-600">
                                    {formatRupiah(trx.pendapatan_pemilik)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={
                                      trx.status_pembayaran === 'sukses' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                      trx.status_pembayaran === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                      'bg-red-100 text-red-700 hover:bg-red-100'
                                    }>
                                      {trx.status_pembayaran === 'sukses' ? 'SUKSES' : trx.status_pembayaran === 'pending' ? 'PENDING' : 'GAGAL'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={
                                      trx.status_sewa === 'selesai' ? 'bg-emerald-600 text-white hover:bg-emerald-600' :
                                      trx.status_sewa === 'sedang_disewa' ? 'bg-blue-600 text-white hover:bg-blue-600' :
                                      trx.status_sewa === 'dibayar' ? 'bg-teal-600 text-white hover:bg-teal-600' :
                                      trx.status_sewa === 'dibatalkan' ? 'bg-red-600 text-white hover:bg-red-600' :
                                      'bg-gray-500 text-white hover:bg-gray-500'
                                    }>
                                      {trx.status_sewa.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 2: KELOLA BARANG */}
              {activeTab === 'gears' && (
                <Card className="shadow-lg border rounded-2xl bg-card dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-6 flex flex-row items-center justify-between border-b">
                    <div>
                      <CardTitle className="text-xl font-extrabold">Inventaris Barang Anda</CardTitle>
                      <CardDescription>
                        Tambahkan, perbarui stok, atau hapus peralatan outdoor yang Anda sewakan secara real-time.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setAddModalOpen(true)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl"
                    >
                      <Plus className="size-4 mr-2" /> Tambah Barang
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingGears ? (
                      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat inventaris alat...</span>
                      </div>
                    ) : gears.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-2 m-6 rounded-2xl bg-gray-50/50">
                        <div className="size-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                          <Package className="size-7" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Belum ada barang terdaftar</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-6">
                          Anda belum mendaftarkan peralatan penyewaan outdoor Anda. Daftarkan tenda, carrier, atau sleeping bag pertama Anda sekarang!
                        </p>
                        <Button onClick={() => setAddModalOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl">
                          Tambah Alat Pertama Anda
                        </Button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-bold w-[70px]">Foto</TableHead>
                              <TableHead className="font-bold">Nama Barang</TableHead>
                              <TableHead className="font-bold">Kategori</TableHead>
                              <TableHead className="font-bold">Harga Sewa / Hari</TableHead>
                              <TableHead className="font-bold text-center">Min. Durasi</TableHead>
                              <TableHead className="font-bold text-center">Stok</TableHead>
                              <TableHead className="font-bold text-center">Status Barang</TableHead>
                              <TableHead className="font-bold text-center">Approval Admin</TableHead>
                              <TableHead className="font-bold text-right pr-6">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gears.map((gear) => (
                              <TableRow key={gear.id_barang}>
                                <TableCell>
                                  {gear.foto_barang ? (
                                    <img 
                                      src={getGearPhoto(gear.foto_barang)} 
                                      alt={gear.nama_barang} 
                                      className="size-12 rounded-lg object-cover border" 
                                    />
                                  ) : (
                                    <div className="size-12 bg-slate-100 rounded-lg flex items-center justify-center text-muted-foreground">
                                      <Package className="size-5" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold text-gray-900 dark:text-white leading-none">{gear.nama_barang}</div>
                                  {gear.deskripsi && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-1">{gear.deskripsi}</p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-semibold text-xs border bg-muted/50 dark:bg-slate-800">
                                    {gear.kategori?.nama_kategori || 'Alat'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-emerald-600">
                                  {formatRupiah(gear.harga_sewa)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="text-xs font-bold">
                                    {gear.min_durasi_sewa || 1} Hari
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  <span className={gear.jumlah_stok <= 1 ? 'text-red-500 font-extrabold' : ''}>
                                    {gear.jumlah_stok}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={gear.status_barang === 'tersedia' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                                    {gear.status_barang.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={
                                    gear.status_approval === 'disetujui' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                    gear.status_approval === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 animate-pulse' :
                                    'bg-red-100 text-red-700 hover:bg-red-100'
                                  }>
                                    {gear.status_approval.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6 shrink-0">
                                  <div className="flex gap-2 justify-end">
                                    {/* Edit diizinkan untuk semua status, perubahan data pada barang approved akan me-reset status ke pending */}
                                    <Button 
                                      onClick={() => openEditModal(gear)}
                                      variant="outline" 
                                      size="icon" 
                                      className="size-8 rounded-lg hover:border-emerald-500 hover:text-emerald-600"
                                      title="Ubah Detail & Stok Barang"
                                    >
                                      <Edit className="size-3.5" />
                                    </Button>
                                    
                                    <Button 
                                      onClick={() => handleDeleteGear(gear.id_barang)}
                                      variant="outline" 
                                      size="icon" 
                                      className="size-8 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-lg"
                                      title="Hapus Barang"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: PENYEWAAN MASUK */}
              {activeTab === 'transactions' && (
                <Card className="shadow-lg border rounded-2xl bg-card dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="p-6 border-b">
                    <CardTitle className="text-xl font-extrabold">Daftar Penyewaan Masuk</CardTitle>
                    <CardDescription>
                      Kelola transaksi penyewaan dari customer lain yang menyewa peralatan outdoor milik Anda.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingTransactions ? (
                      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat transaksi masuk...</span>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-background m-6 rounded-2xl border-2 border-dashed">
                        <div className="size-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                          <ShoppingBag className="size-7" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Belum ada order sewa masuk</h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                          Peralatan outdoor Anda belum memiliki transaksi sewa. Tawarkan barang dengan harga kompetitif untuk mulai menarik penyewa!
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-bold">Detail Rantai Sewa</TableHead>
                              <TableHead className="font-bold">Barang outdoor</TableHead>
                              <TableHead className="font-bold">Durasi Sewa</TableHead>
                              <TableHead className="font-bold">Earning (80%)</TableHead>
                              <TableHead className="font-bold text-center">Status Pembayaran</TableHead>
                              <TableHead className="font-bold text-center">Status Sewa</TableHead>
                              <TableHead className="font-bold text-right pr-6">Kelola Order</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.map((trx) => (
                              <TableRow key={trx.id_transaksi}>
                                <TableCell>
                                  <div className="font-bold text-gray-900 dark:text-white leading-none">
                                    <button 
                                      onClick={() => handleChatWithCustomer(trx.id_penyewa, trx.penyewa?.nama)}
                                      className="chat-trigger-btn hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline text-left font-bold cursor-pointer"
                                      title={`Chat dengan ${trx.penyewa?.nama || 'Customer'}`}
                                    >
                                      {trx.penyewa?.nama || 'Customer'}
                                    </button>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-semibold mt-1">
                                    ORDER ID: {trx.midtrans_order_id || `TRX-${trx.id_transaksi}`}
                                  </div>
                                  {trx.penyewa?.no_telp && (
                                    <p className="text-xs text-emerald-600 font-semibold mt-1">Telp: {trx.penyewa.no_telp}</p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {trx.detail_transaksi && trx.detail_transaksi.length > 0 ? (
                                    <div className="space-y-1">
                                      {trx.detail_transaksi.map((detail, idx) => (
                                        <div key={detail.id_detail || idx} className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                          <div>
                                            <div className="font-semibold text-gray-800 leading-tight text-xs">{detail.nama_barang || detail.barang?.nama_barang}</div>
                                            <div className="text-[10px] text-muted-foreground">{detail.jumlah_pinjam} unit × {formatRupiah(detail.harga_per_hari || detail.barang?.harga_sewa)}/hari</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <>
                                      <div className="font-semibold text-gray-800 leading-tight">{trx.nama_barang}</div>
                                      <div className="text-[10px] text-muted-foreground mt-0.5">Jumlah Pinjam: {trx.jumlah} unit</div>
                                    </>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold">{trx.total_hari} Hari</div>
                                  <div className="text-[10px] text-muted-foreground font-medium">
                                    {trx.tanggal_mulai} s/d {trx.tanggal_selesai}
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-emerald-600">
                                  <div>{formatRupiah(trx.pendapatan_pemilik)}</div>
                                  <div className="text-[9px] text-muted-foreground">Total: {formatRupiah(trx.total_biaya)}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={
                                    trx.status_pembayaran === 'sukses' ? 'bg-green-100 text-green-700 hover:bg-green-100 font-bold' :
                                    trx.status_pembayaran === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold' :
                                    'bg-red-100 text-red-700 hover:bg-red-100 font-bold'
                                  }>
                                    {trx.status_pembayaran.toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={
                                    trx.status_sewa === 'selesai' ? 'bg-emerald-600 text-white hover:bg-emerald-600 font-bold' :
                                    trx.status_sewa === 'sedang_disewa' ? 'bg-blue-600 text-white hover:bg-blue-600 font-bold' :
                                    trx.status_sewa === 'dibayar' ? 'bg-teal-600 text-white hover:bg-teal-600 font-bold' :
                                    trx.status_sewa === 'dibatalkan' ? 'bg-red-600 text-white hover:bg-red-600 font-bold' :
                                    'bg-gray-500 text-white hover:bg-gray-500 font-bold'
                                  }>
                                    {trx.status_sewa.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex gap-2 justify-end">
                                    {/* Action Buttons based on status_sewa */}
                                    
                                    {['menunggu_pembayaran', 'dibayar'].includes(trx.status_sewa) && (
                                      <Button 
                                        onClick={() => handleUpdateStatusSewa(trx.id_transaksi, 'dibatalkan')}
                                        variant="outline"
                                        className="text-red-500 border-red-200 hover:bg-red-50 text-xs px-2 py-1 rounded-lg h-8"
                                      >
                                        Batalkan
                                      </Button>
                                    )}

                                    {!['dibayar', 'sedang_disewa', 'menunggu_pembayaran'].includes(trx.status_sewa) && (
                                      <span className="text-xs text-muted-foreground italic font-semibold">Tuntas</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TAB 4: REFUND BARANG */}
              {activeTab === 'refunds' && (
                <Card className="shadow-sm border rounded-2xl bg-card dark:bg-slate-900">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <RotateCcw className="size-5 text-rose-500" />
                          Refund Barang Saya
                        </CardTitle>
                        <CardDescription>Daftar pengajuan pengembalian barang yang Anda miliki</CardDescription>
                      </div>
                      {stats.totalRefund > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Refund</p>
                          <p className="text-lg font-black text-rose-500">-{formatRupiah(stats.totalRefund)}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingRefunds ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="size-6 animate-spin text-emerald-600 mr-2" />
                        <span className="text-sm text-muted-foreground">Memuat data refund...</span>
                      </div>
                    ) : refundRequests.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <RotateCcw className="size-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-semibold">Belum ada pengajuan refund</p>
                        <p className="text-sm mt-1">Jika ada customer yang mengajukan pengembalian, akan muncul di sini.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {refundRequests.map((req) => {
                          const fotoBukti = Array.isArray(req.foto_bukti) ? req.foto_bukti : (typeof req.foto_bukti === 'string' ? JSON.parse(req.foto_bukti || '[]') : [])
                          
                          const statusColors = {
                            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                            disetujui: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
                            ditolak: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400',
                          }
                          const statusLabel = {
                            pending: 'Menunggu Review',
                            disetujui: 'Disetujui',
                            ditolak: 'Ditolak',
                          }
                          const refundStatusColors = {
                            belum_refund: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                            proses_refund: 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
                            sudah_refund: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
                          }
                          const refundStatusLabel = {
                            belum_refund: 'Belum Refund',
                            proses_refund: 'Proses Refund',
                            sudah_refund: 'Sudah Direfund',
                          }

                          return (
                            <div key={req.id_pengajuan} className="border rounded-2xl p-5 space-y-3 bg-background dark:bg-slate-800/30 hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`text-[10px] font-bold border-0 ${statusColors[req.status] || statusColors.pending}`}>
                                      {statusLabel[req.status] || req.status}
                                    </Badge>
                                    {/* Metode pengembalian badge */}
                                    <Badge className={`text-[10px] font-bold border-0 ${
                                      req.metode_pengembalian === 'delivery'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                      {req.metode_pengembalian === 'delivery' ? (
                                        <><Truck className="size-3 mr-1" /> Delivery</>
                                      ) : (
                                        <><Store className="size-3 mr-1" /> Pickup</>
                                      )}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-base mt-2 text-foreground dark:text-white">
                                    {req.transaksi?.nama_barang || 'Barang tidak ditemukan'}
                                  </h4>
                                </div>
                                {/* Customer photo thumbnails */}
                                <div className="flex -space-x-2 shrink-0">
                                  {fotoBukti.slice(0, 3).map((foto, idx) => (
                                    <img
                                      key={idx}
                                      src={`${BASE_URL}/storage/${foto}`}
                                      alt="Bukti"
                                      className="size-10 rounded-xl border-2 border-white dark:border-slate-800 object-cover cursor-pointer hover:scale-110 transition-transform"
                                      onClick={() => window.open(`${BASE_URL}/storage/${foto}`, '_blank')}
                                    />
                                  ))}
                                  {fotoBukti.length > 3 && (
                                    <div className="size-10 rounded-xl bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-muted-foreground dark:text-muted-foreground">
                                      +{fotoBukti.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Customer & Alasan */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-xs text-muted-foreground">Customer:</span>
                                  <p className="font-medium text-foreground">
                                    {req.customer?.nama || req.transaksi?.penyewa?.nama || '-'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Alasan Pengembalian:</span>
                                  <p className="font-medium text-foreground">{req.alasan}</p>
                                </div>
                              </div>

                              {/* Alamat Pengembalian (delivery) */}
                              {req.metode_pengembalian === 'delivery' && req.alamat_pengembalian && (
                                <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900">
                                  <Truck className="size-3.5 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold">Alamat Pengambilan:</span>
                                    <p className="mt-0.5">{req.alamat_pengembalian}</p>
                                  </div>
                                </div>
                              )}

                              {/* Info Rekening Customer */}
                              {req.nama_bank && req.no_rekening && (
                                <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                                  <DollarSign className="size-3.5 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold">Rekening Refund:</span>
                                    <p className="mt-0.5">
                                      <span className="font-bold">{req.nama_bank}</span>
                                      <span className="mx-1">•</span>
                                      <span className="font-mono">{req.no_rekening}</span>
                                      <span className="mx-1">•</span>
                                      <span>a.n. {req.atas_nama_rekening}</span>
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Admin Note */}
                              {req.catatan_admin && (
                                <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900 rounded-xl px-4 py-2 text-sm">
                                  <span className="font-bold text-amber-700 dark:text-amber-400">Catatan Admin:</span>{' '}
                                  <span className="text-amber-800 dark:text-amber-300">{req.catatan_admin}</span>
                                </div>
                              )}

                              {/* Dynamic Refund Breakdown */}
                              {req.status === 'disetujui' && (
                                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 space-y-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="size-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Rincian Refund Dinamis</span>
                                  </div>

                                  {/* Breakdown line items */}
                                  <div className="space-y-1.5 text-xs">
                                    {req.sisa_hari_sewa != null && (
                                      <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="size-3" />
                                          Sisa Hari Sewa
                                        </span>
                                        <span className="font-bold text-foreground">{req.sisa_hari_sewa} hari</span>
                                      </div>
                                    )}

                                    {Number(req.refund_sewa) > 0 && (
                                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                                        <span>Refund Sewa (proporsional)</span>
                                        <span className="font-bold">+ {formatRupiah(req.refund_sewa)}</span>
                                      </div>
                                    )}

                                    {Number(req.refund_deposit) > 0 && (
                                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                                        <span>Pengembalian Deposit</span>
                                        <span className="font-bold">+ {formatRupiah(req.refund_deposit)}</span>
                                      </div>
                                    )}

                                    {Number(req.potongan_admin_fee) > 0 && (
                                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                                        <span>Potongan Admin Fee</span>
                                        <span className="font-bold">- {formatRupiah(req.potongan_admin_fee)}</span>
                                      </div>
                                    )}

                                    {/* Ongkir (ditanggung admin) */}
                                    {req.metode_pengembalian === 'delivery' && Number(req.biaya_ongkir_pengembalian) > 0 && (
                                      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1.5 rounded-lg -mx-1">
                                        <span className="flex items-center gap-1.5">
                                          <Truck className="size-3" />
                                          Ongkir Pengembalian
                                        </span>
                                        <span className="font-bold text-[10px]">
                                          {formatRupiah(req.biaya_ongkir_pengembalian)}
                                          <span className="text-blue-400 dark:text-blue-500 ml-1 font-normal">(ditanggung admin)</span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Total */}
                                    <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2 mt-2 flex items-center justify-between">
                                      <span className="font-bold text-foreground">Total Refund</span>
                                      <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                                        -{formatRupiah(req.jumlah_refund)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Refund status row */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                                    <div>
                                      <span className="text-muted-foreground">Status Refund:</span>
                                      <Badge className={`text-[9px] font-bold border-0 mt-1 ${refundStatusColors[req.status_refund] || refundStatusColors.belum_refund}`}>
                                        {refundStatusLabel[req.status_refund] || 'Belum Refund'}
                                      </Badge>
                                    </div>
                                    {req.metode_refund && (
                                      <div>
                                        <span className="text-muted-foreground">Metode:</span>
                                        <p className="font-medium capitalize">{req.metode_refund.replace('_', ' ')}</p>
                                      </div>
                                    )}
                                    {req.tanggal_refund && (
                                      <div>
                                        <span className="text-muted-foreground">Tanggal Refund:</span>
                                        <p className="font-medium">{new Date(req.tanggal_refund).toLocaleDateString('id-ID')}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Bukti transfer dari admin */}
                                  {req.bukti_refund && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                                      <span className="text-xs text-muted-foreground block mb-1.5">Bukti Transfer dari Admin:</span>
                                      <img
                                        src={`${BASE_URL}/storage/${req.bukti_refund}`}
                                        alt="Bukti Transfer Refund"
                                        className="w-40 rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                        onClick={() => window.open(`${BASE_URL}/storage/${req.bukti_refund}`, '_blank')}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          </div>

        </div>
      </div>



      {/* Add Gear Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card dark:bg-slate-900 border">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Ajukan Barang Baru</DialogTitle>
              <DialogDescription>
                Isi detail barang outdoor Anda. Admin akan meninjau dan menyetujuinya agar tampil di halaman pencarian sewa.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Nama Barang */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add_nama" className="text-right font-medium">Nama Alat*</Label>
                <Input 
                  id="add_nama" 
                  placeholder="Contoh: Tenda Dome Eiger 4P" 
                  className="col-span-3 rounded-lg"
                  required 
                  value={addForm.nama_barang}
                  onChange={(e) => setAddForm(prev => ({ ...prev, nama_barang: e.target.value }))}
                />
              </div>

              {/* Kategori */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add_kat" className="text-right font-medium">Kategori*</Label>
                <select 
                  id="add_kat" 
                  className="col-span-3 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800"
                  required
                  value={addForm.id_kategori}
                  onChange={(e) => setAddForm(prev => ({ ...prev, id_kategori: e.target.value }))}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => (
                    <option key={c.id_kategori} value={c.id_kategori}>
                      {c.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga Sewa */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add_harga" className="text-right font-medium">Harga / Hari*</Label>
                <Input 
                  id="add_harga" 
                  type="number"
                  placeholder="Contoh: 50000" 
                  className="col-span-3 rounded-lg"
                  required 
                  value={addForm.harga_sewa}
                  onChange={(e) => {
                    const harga = e.target.value;
                    const deposit = harga ? Math.round(Number(harga) * 0.2) : '';
                    setAddForm(prev => ({ 
                      ...prev, 
                      harga_sewa: harga,
                      nominal_deposit: deposit
                    }));
                  }}
                />
              </div>

              {/* Nominal Deposit */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add_deposit" className="text-right font-medium mt-2">Deposit</Label>
                <div className="col-span-3">
                  <Input 
                    id="add_deposit" 
                    type="number"
                    placeholder="Otomatis 20% dari Harga" 
                    className="rounded-lg bg-muted/50 border-border text-muted-foreground font-semibold"
                    value={addForm.nominal_deposit}
                    readOnly
                  />
                  <p className="text-[11px] text-emerald-600 mt-1.5 leading-snug font-semibold">
                    ✨ Deposit dihitung otomatis sebesar 20% dari Harga Sewa Harian (Refundable untuk customer).
                  </p>
                </div>
              </div>

              {/* Minimum Durasi Sewa */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add_min_durasi" className="text-right font-medium mt-2">Min. Durasi Sewa*</Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Input 
                      id="add_min_durasi" 
                      type="number"
                      min="1"
                      placeholder="1" 
                      className="rounded-lg w-24"
                      required 
                      value={addForm.min_durasi_sewa}
                      onChange={(e) => setAddForm(prev => ({ ...prev, min_durasi_sewa: parseInt(e.target.value) || 1 }))}
                    />
                    <span className="text-sm text-muted-foreground font-medium">Hari</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                    📅 Customer harus menyewa minimal selama <strong className="text-emerald-600">{addForm.min_durasi_sewa || 1} hari</strong>. Set ke 1 jika tidak ada minimum.
                  </p>
                </div>
              </div>

              {/* Jumlah Stok */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add_stok" className="text-right font-medium">Jumlah Stok*</Label>
                <Input 
                  id="add_stok" 
                  type="number"
                  placeholder="Contoh: 5" 
                  className="col-span-3 rounded-lg"
                  required 
                  value={addForm.jumlah_stok}
                  onChange={(e) => setAddForm(prev => ({ ...prev, jumlah_stok: e.target.value }))}
                />
              </div>

              {/* Deskripsi */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="add_desc" className="text-right font-medium mt-2">Deskripsi</Label>
                <textarea 
                  id="add_desc" 
                  placeholder="Jelaskan spesifikasi, kondisi, dan kelengkapan alat outdoor Anda..." 
                  rows={3}
                  className="col-span-3 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  value={addForm.deskripsi}
                  onChange={(e) => setAddForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                />
              </div>

              {/* Metode Penyerahan ke Gudang */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium mt-2">Penyerahan Barang*</Label>
                <div className="col-span-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, metode_penyerahan: 'pickup', no_resi_penyerahan: '' }))}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${
                        addForm.metode_penyerahan === 'pickup'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Store className="size-4" /> Datang ke Gudang
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, metode_penyerahan: 'delivery' }))}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${
                        addForm.metode_penyerahan === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Truck className="size-4" /> Kirim via Kurir (Delivery)
                    </button>
                  </div>

                  {addForm.metode_penyerahan === 'delivery' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Input
                        type="text"
                        placeholder="Masukkan nama kurir & nomor resi pengiriman (Contoh: JNE - 123456789)"
                        className="rounded-lg text-xs"
                        value={addForm.no_resi_penyerahan}
                        onChange={(e) => setAddForm(prev => ({ ...prev, no_resi_penyerahan: e.target.value }))}
                        required={addForm.metode_penyerahan === 'delivery'}
                      />
                    </div>
                  )}

                  <div className="bg-muted/50 p-3 rounded-xl text-[10px] text-muted-foreground border border-dashed leading-relaxed">
                    💡 <strong>Gudang SiPetualang:</strong> Jl. Petualang No. 100, Bandung. Barang harus diserahkan/dikirimkan ke gudang untuk diverifikasi admin sebelum alat sewa dipublikasikan secara live di katalog.
                  </div>
                </div>
              </div>

              {/* Upload Foto */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add_foto" className="text-right font-medium">Foto Barang</Label>
                <div className="col-span-3 flex items-center gap-3">
                  <label 
                    htmlFor="add_foto"
                    className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold transition"
                  >
                    <Upload className="size-4" />
                    Pilih Foto
                  </label>
                  <input 
                    id="add_foto" 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddPhotoChange}
                  />
                  {addPhotoPreview && (
                    <img 
                      src={addPhotoPreview} 
                      alt="Preview" 
                      className="size-12 rounded-lg object-cover border" 
                    />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddModalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Kirim Pengajuan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Gear Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card dark:bg-slate-900 border">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Ubah Detail & Stok Alat</DialogTitle>
              <DialogDescription>
                Sesuaikan informasi, harga sewa, stok barang, atau unggah foto baru untuk peralatan Anda.
              </DialogDescription>
            </DialogHeader>

            {/* Warning for approved items */}
            {selectedGear?.status_approval === 'disetujui' && (
              <div className="mx-0 mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Barang ini sudah disetujui admin</p>
                  <p className="mt-0.5 text-amber-600 dark:text-amber-500 leading-relaxed">
                    Mengubah <strong>stok</strong> tidak memerlukan persetujuan ulang.
                    Namun jika Anda mengubah <strong>nama, harga, kategori, deskripsi, atau foto</strong>, barang akan kembali ke status <strong>"Pending"</strong> untuk ditinjau ulang oleh admin.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 py-4">
              {/* Nama Barang */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_nama" className="text-right font-medium">Nama Alat*</Label>
                <Input 
                  id="edit_nama" 
                  className="col-span-3 rounded-lg"
                  required 
                  value={editForm.nama_barang}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nama_barang: e.target.value }))}
                />
              </div>

              {/* Kategori */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_kat" className="text-right font-medium">Kategori*</Label>
                <select 
                  id="edit_kat" 
                  className="col-span-3 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800"
                  required
                  value={editForm.id_kategori}
                  onChange={(e) => setEditForm(prev => ({ ...prev, id_kategori: e.target.value }))}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => (
                    <option key={c.id_kategori} value={c.id_kategori}>
                      {c.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga Sewa */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_harga" className="text-right font-medium">Harga / Hari*</Label>
                <Input 
                  id="edit_harga" 
                  type="number"
                  className="col-span-3 rounded-lg"
                  required 
                  value={editForm.harga_sewa}
                  onChange={(e) => {
                    const harga = e.target.value;
                    const deposit = harga ? Math.round(Number(harga) * 0.2) : '';
                    setEditForm(prev => ({ 
                      ...prev, 
                      harga_sewa: harga,
                      nominal_deposit: deposit
                    }));
                  }}
                />
              </div>

              {/* Nominal Deposit */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit_deposit" className="text-right font-medium mt-2">Deposit</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit_deposit" 
                    type="number"
                    placeholder="Otomatis 20% dari Harga" 
                    className="rounded-lg bg-muted/50 border-border text-muted-foreground font-semibold"
                    value={editForm.nominal_deposit}
                    readOnly
                  />
                  <p className="text-[11px] text-emerald-600 mt-1.5 leading-snug font-semibold">
                    ✨ Deposit dihitung otomatis sebesar 20% dari Harga Sewa Harian (Refundable untuk customer).
                  </p>
                </div>
              </div>

              {/* Minimum Durasi Sewa */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit_min_durasi" className="text-right font-medium mt-2">Min. Durasi Sewa*</Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Input 
                      id="edit_min_durasi" 
                      type="number"
                      min="1"
                      placeholder="1" 
                      className="rounded-lg w-24"
                      required 
                      value={editForm.min_durasi_sewa}
                      onChange={(e) => setEditForm(prev => ({ ...prev, min_durasi_sewa: parseInt(e.target.value) || 1 }))}
                    />
                    <span className="text-sm text-muted-foreground font-medium">Hari</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                    📅 Customer harus menyewa minimal selama <strong className="text-emerald-600">{editForm.min_durasi_sewa || 1} hari</strong>. Set ke 1 jika tidak ada minimum.
                  </p>
                </div>
              </div>

              {/* Jumlah Stok */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit_stok" className="text-right font-medium mt-2">Jumlah Stok*</Label>
                <div className="col-span-3">
                  <Input 
                    id="edit_stok" 
                    type="number"
                    min="0"
                    className="rounded-lg"
                    required 
                    value={editForm.jumlah_stok}
                    onChange={(e) => setEditForm(prev => ({ ...prev, jumlah_stok: e.target.value }))}
                  />
                  {selectedGear?.status_approval === 'disetujui' && (
                    <p className="text-[11px] text-emerald-600 mt-1.5 leading-snug font-semibold">
                      ✅ Perubahan stok langsung tersimpan tanpa perlu persetujuan ulang admin.
                    </p>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit_desc" className="text-right font-medium mt-2">Deskripsi</Label>
                <textarea 
                  id="edit_desc" 
                  rows={3}
                  className="col-span-3 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  value={editForm.deskripsi}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                />
              </div>

              {/* Metode Penyerahan ke Gudang */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-medium mt-2">Penyerahan Barang*</Label>
                <div className="col-span-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, metode_penyerahan: 'pickup', no_resi_penyerahan: '' }))}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${
                        editForm.metode_penyerahan === 'pickup'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Store className="size-4" /> Datang ke Gudang
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, metode_penyerahan: 'delivery' }))}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors flex flex-col items-center justify-center gap-1.5 ${
                        editForm.metode_penyerahan === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Truck className="size-4" /> Kirim via Kurir (Delivery)
                    </button>
                  </div>

                  {editForm.metode_penyerahan === 'delivery' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <Input
                        type="text"
                        placeholder="Masukkan nama kurir & nomor resi pengiriman (Contoh: JNE - 123456789)"
                        className="rounded-lg text-xs"
                        value={editForm.no_resi_penyerahan}
                        onChange={(e) => setEditForm(prev => ({ ...prev, no_resi_penyerahan: e.target.value }))}
                        required={editForm.metode_penyerahan === 'delivery'}
                      />
                    </div>
                  )}

                  <div className="bg-muted/50 p-3 rounded-xl text-[10px] text-muted-foreground border border-dashed leading-relaxed">
                    💡 <strong>Gudang SiPetualang:</strong> Jl. Petualang No. 100, Bandung. Barang harus diserahkan/dikirimkan ke gudang untuk diverifikasi admin sebelum alat sewa dipublikasikan secara live di katalog.
                  </div>
                </div>
              </div>

              {/* Upload Foto */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_foto" className="text-right font-medium">Foto Barang</Label>
                <div className="col-span-3 flex items-center gap-3">
                  <label 
                    htmlFor="edit_foto"
                    className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-semibold transition"
                  >
                    <Upload className="size-4" />
                    Ubah Foto
                  </label>
                  <input 
                    id="edit_foto" 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditPhotoChange}
                  />
                  {editPhotoPreview && (
                    <img 
                      src={editPhotoPreview} 
                      alt="Preview" 
                      className="size-12 rounded-lg object-cover border" 
                    />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-700">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* FLOATING CHAT WIDGET - triggered from handleChatWithCustomer in transaction tables */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            ref={chatContainerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 w-[360px] h-[480px] rounded-2xl shadow-2xl bg-card border border-border overflow-hidden flex flex-col z-[9999]"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center gap-3">
              {activeChatId ? (
                <>
                  <Button 
                    onClick={() => {
                      setActiveChatId(null)
                      setActiveChatUser(null)
                      setChatMessages([])
                    }}
                    variant="ghost" 
                    size="icon" 
                    className="size-8 hover:bg-white/10 rounded-lg text-white"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{activeChatUser?.nama}</h4>
                    <p className="text-[10px] text-emerald-100 truncate">{activeChatUser?.kota || 'Penyewa'}</p>
                  </div>
                  <Button 
                    onClick={() => setIsChatOpen(false)}
                    variant="ghost" 
                    size="icon" 
                    className="size-8 hover:bg-white/10 rounded-lg text-white"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">Pesan Customer</h4>
                    <p className="text-[10px] text-emerald-100">Hubungi customer secara langsung</p>
                  </div>
                  <Button 
                    onClick={() => setIsChatOpen(false)}
                    variant="ghost" 
                    size="icon" 
                    className="size-8 hover:bg-white/10 rounded-lg text-white"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}
            </div>

            {/* BODY CONTENT */}
            <div className="flex-1 overflow-y-auto bg-muted/50 dark:bg-slate-950 flex flex-col">
              {activeChatId ? (
                chatLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                    <Loader2 className="size-6 animate-spin text-emerald-600" />
                    <span>Memuat obrolan...</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Belum ada pesan. Mulai kirim balasan di bawah!
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const myId = user.id || user.id_pengguna
                        const isMe = msg.id_sender === myId
                        return (
                          <div 
                            key={msg.id_message} 
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                              isMe 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none' 
                                : 'bg-card border border-border text-foreground rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed break-words">{msg.message}</p>
                              <span className={`text-[8px] block text-right mt-1 ${isMe ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )
              ) : (
                <>
                  <div className="p-3 border-b border-border bg-card flex items-center relative">
                    <Search className="size-3.5 absolute left-6 text-muted-foreground" />
                    <Input 
                      placeholder="Cari customer..." 
                      className="h-8 rounded-lg pl-8 text-xs bg-muted/50 dark:bg-slate-950 border-none outline-none"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                    {filteredChatConvs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <MessageCircle className="size-8 text-muted-foreground" />
                        <span>Tidak ada obrolan</span>
                      </div>
                    ) : (
                      filteredChatConvs.map((conv) => {
                        const otherUser = getOtherUserInConv(conv)
                        return (
                          <button
                            key={conv.id_conversation}
                            onClick={() => handleOpenConversation(conv)}
                            className="w-full p-3.5 flex gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition items-start"
                          >
                            <Avatar className="size-9 rounded-xl shadow-sm shrink-0 ring-2 ring-emerald-500/10">
                              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-bold">
                                {otherUser?.nama?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <h5 className="font-bold text-xs text-foreground truncate">{otherUser?.nama}</h5>
                                <span className="text-[9px] text-muted-foreground font-semibold shrink-0">
                                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate mt-0.5">
                                {conv.last_message || 'Belum ada pesan'}
                              </p>
                              {conv.unread_count > 0 && (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 scale-75 mt-1.5 -ml-1">
                                  {conv.unread_count} Pesan Baru
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* QUICK REPLY FOOTER */}
            {activeChatId && (
              <form 
                onSubmit={handleSendQuickMessage}
                className="p-3 border-t border-border bg-card flex gap-2 items-center"
              >
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik balasan cepat..." 
                  className="flex-1 h-9 rounded-xl text-xs bg-muted/50 border-none dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500"
                  disabled={sendingMsg}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={sendingMsg || !chatInput.trim()}
                  className="size-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md border-none"
                >
                  {sendingMsg ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
