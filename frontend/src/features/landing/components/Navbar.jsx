import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import NotificationBell from '@/components/NotificationBell'
import { User, LogOut, X, ArrowLeft, Send, Loader2, Search, MessageCircle } from 'lucide-react'
import logo from '@/assets/beranda/Logo.png'
import cartIcon from '@/assets/beranda/icon-simple-cart.svg'
import arrowRight from '@/assets/beranda/icon-arrow-right.svg'
import api from '@/services/api'
import { getStorageUrl } from '@/utils/storageUrl'

export default function Navbar({ forceScrolled = false }) {
  const [scrolled, setScrolled] = useState(forceScrolled)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { t } = useLanguage()
  const { user, isAuthenticated, isLoading, logout, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [unreadChats, setUnreadChats] = useState(0)
  const [cartCount, setCartCount] = useState(0)

  // CART COUNT - membaca jumlah item dari localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('rental_cart') || '[]')
        setCartCount(cart.length)
      } catch {
        setCartCount(0)
      }
    }

    // Initial load
    updateCartCount()

    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', updateCartCount)

    // Listen for custom event (same-tab updates)
    window.addEventListener('cart-updated', updateCartCount)

    // Polling fallback setiap 2 detik
    const interval = setInterval(updateCartCount, 2000)

    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cart-updated', updateCartCount)
      clearInterval(interval)
    }
  }, [])

  // Chat Popup States
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

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChats(0)
      return
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

    fetchUnreadChats()
    const interval = setInterval(fetchUnreadChats, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // === Rental Notifications for Perental Users ===
  const [rentalNotifications, setRentalNotifications] = useState([])

  useEffect(() => {
    if (!isAuthenticated || user?.rental !== 'true') {
      setRentalNotifications([])
      return
    }

    const fetchRentalData = async () => {
      try {
        const [gearsRes, trxRes] = await Promise.all([
          api.get('/customer/rental/barang'),
          api.get('/customer/transaksi/pemilik')
        ])
        const gears = gearsRes.data?.data || gearsRes.data || []
        const transactions = trxRes.data?.data || trxRes.data || []
        const now = new Date().toISOString()
        const newNotifications = []

        // Stock warnings (< 5 units)
        const criticalItems = Array.isArray(gears) ? gears.filter(g => g.jumlah_stok < 5) : []
        criticalItems.forEach((item) => {
          const severityLevel = item.jumlah_stok <= 2 ? 'danger' : 'warning'
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

        // Incoming rentals (paid but not yet rented)
        const incomingRentals = Array.isArray(transactions)
          ? transactions.filter(t => t.status_pembayaran === 'sukses' && t.status_sewa === 'dibayar')
          : []
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

        setRentalNotifications(newNotifications)
      } catch (err) {
        console.error('Gagal fetch data rental untuk notifikasi:', err)
      }
    }

    fetchRentalData()
    const interval = setInterval(fetchRentalData, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.rental])

  // Determine rental nav label & link based on role
  const isPerental = user?.peran_pengguna === 'perental';

  // Nav links
  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.catalog'), href: '/sewa-alat' },
    { label: t('nav.howItWorks'), href: '/cara-sewa' },
    { label: (isPerental || user?.rental === 'true') ? 'Buka Dashboard' : t('nav.about'), href: (isPerental || user?.rental === 'true') ? '/rental-dashboard' : '/buka-rental' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(forceScrolled || window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [forceScrolled])

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest('.user-menu')) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropdownOpen])

  // Click outside to close chat popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
        setIsChatOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [chatContainerRef])

  const handleLogout = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    await logout()
    toast.success(t('toast.logoutSuccess'))
    navigate('/')
  }

  const handleCartClick = () => {
    if (isAuthenticated) {
      navigate('/customer/cart')
    } else {
      navigate('/login')
    }
  }

  const handleChatClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const nextOpen = !isChatOpen
    setIsChatOpen(nextOpen)
    if (nextOpen) {
      fetchConversationsList()
    }
  }

  // Ambil inisial nama (MAX 2 huruf)
  const getUserInitials = () => {
    if (!user?.nama) return '?'
    const names = user.nama.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  // Get profile photo URL
  const getProfilePhotoUrl = () => getStorageUrl(user?.profile_photo)

  // Check if a nav link is active
  const isActiveLink = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href
  }

  // === Chat Popup Helpers ===
  const getOtherUserInConv = (conv) => {
    if (!user) return null
    const myId = user.id || user.id_pengguna
    return Number(conv.id_user_a) === Number(myId) ? conv.user_b : conv.user_a
  }

  const fetchConversationsList = async () => {
    try {
      const res = await api.get('/customer/chat/conversations')
      setChatConversations(res.data.data || [])
    } catch (err) {
      console.error("Gagal memuat percakapan:", err)
    }
  }

  const fetchChatMessages = async (conversationId, silent = false) => {
    if (!conversationId) return
    try {
      if (!silent) setChatLoading(true)
      const res = await api.get(`/customer/chat/messages/${conversationId}`)
      const messagesData = res.data.data?.messages || []
      setChatMessages(messagesData)
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error("Gagal memuat pesan:", err)
    } finally {
      if (!silent) setChatLoading(false)
    }
  }

  const fetchUnreadChatsCount = async () => {
    try {
      const res = await api.get('/customer/chat/conversations')
      const convs = res.data.data || []
      const totalUnread = convs.reduce((sum, item) => sum + (item.unread_count || 0), 0)
      setUnreadChats(totalUnread)
    } catch (err) {
      console.error('Gagal mengambil data chat:', err)
    }
  }

  const handleOpenConversation = (conv) => {
    const otherUser = getOtherUserInConv(conv)
    setActiveChatId(conv.id_conversation)
    setActiveChatUser(otherUser)
    fetchChatMessages(conv.id_conversation)
  }

  const handleSendQuickMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeChatId || sendingMsg) return

    const text = chatInput.trim()
    setChatInput('')
    setSendingMsg(true)

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
      fetchUnreadChatsCount()
    } catch (err) {
      console.error("Gagal mengirim pesan:", err)
      setChatMessages(prev => prev.filter(m => m.id_message !== tempMsg.id_message))
    } finally {
      setSendingMsg(false)
    }
  }

  // Polling for active chat messages
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

  const filteredChatConvs = useMemo(() => {
    if (!chatSearch.trim()) return chatConversations
    return chatConversations.filter(conv => {
      const otherUser = getOtherUserInConv(conv)
      return otherUser?.nama?.toLowerCase().includes(chatSearch.toLowerCase())
    })
  }, [chatConversations, chatSearch, user])

  return (
    <motion.nav
      className={`fixed top-0 inset-x-0 z-[1000] transition-all duration-300 ease-in-out
        ${scrolled
          ? 'bg-black/85 backdrop-blur-[12px] py-3.5 px-[60px] shadow-[0_4px_30px_rgba(0,0,0,0.3)] max-md:py-2.5 max-md:px-4 max-md:w-full max-md:rounded-none'
          : 'py-5 px-[60px] max-md:px-4 max-md:py-3'
        }
        ${mobileOpen ? 'max-md:bg-[rgb(15,15,15)]' : ''}
      `}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className={`max-w-[1400px] mx-auto flex items-center justify-between ${scrolled ? 'pt-5 pb-5 max-md:pt-2 max-md:pb-2' : 'pt-8 max-md:pt-4'}`}>
        <Link to="/" className="max-md:ml-3.5">
          <img src={logo} alt="SiPetualang Logo" className="h-10 w-auto" />
        </Link>

        <ul className="flex gap-10 items-center list-none p-0 m-0 max-md:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={`nav-link-underline text-sm font-medium tracking-[0.3px] relative transition-colors duration-300 ease-in-out no-underline
                  ${isActiveLink(link.href) ? 'text-emerald-300' : 'text-white hover:text-emerald-300'}
                `}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 items-center max-md:hidden">
          <button className="relative bg-transparent p-2 flex items-center justify-center rounded border-none cursor-pointer transition-colors duration-300 ease-in-out hover:bg-white/10" aria-label="Cart" onClick={handleCartClick}>
            <img src={cartIcon} alt="Cart" className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-black pointer-events-none shadow-lg">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
          <NotificationBell variant="navbar" additionalNotifications={rentalNotifications} />

          {/* Chat Popup Button */}
          <div className="relative" ref={chatContainerRef}>
            <button
              onClick={handleChatClick}
              className="relative bg-transparent p-2 flex items-center justify-center rounded border-none cursor-pointer transition-colors duration-300 ease-in-out hover:bg-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadChats > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-black animate-bounce pointer-events-none">
                  {unreadChats}
                </span>
              )}
            </button>

            {/* FLOATING MINI CHAT WIDGET */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-[360px] max-md:w-[calc(100vw-32px)] max-md:fixed max-md:right-4 max-md:left-4 max-md:top-16 h-[480px] max-md:h-[70vh] rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-[1100]"
                >
                  {/* HEADER */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center gap-3">
                    {activeChatId ? (
                      <>
                        <button
                          onClick={() => {
                            setActiveChatId(null)
                            setActiveChatUser(null)
                            setChatMessages([])
                          }}
                          className="size-8 hover:bg-white/10 rounded-lg text-white flex items-center justify-center bg-transparent border-none cursor-pointer"
                        >
                          <ArrowLeft className="size-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{activeChatUser?.nama}</h4>
                          <p className="text-[10px] text-emerald-100 truncate">{activeChatUser?.kota || 'Pengguna'}</p>
                        </div>
                        <button
                          onClick={() => setIsChatOpen(false)}
                          className="size-8 hover:bg-white/10 rounded-lg text-white flex items-center justify-center bg-transparent border-none cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">Pesan</h4>
                          <p className="text-[10px] text-emerald-100">Chat dengan pengguna lain</p>
                        </div>
                        <button
                          onClick={() => setIsChatOpen(false)}
                          className="size-8 hover:bg-white/10 rounded-lg text-white flex items-center justify-center bg-transparent border-none cursor-pointer"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* BODY CONTENT */}
                  <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col">
                    {activeChatId ? (
                      /* CHAT THREAD VIEW */
                      chatLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
                          <Loader2 className="size-6 animate-spin text-emerald-600" />
                          <span>Memuat obrolan...</span>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-8">
                              Belum ada pesan. Mulai kirim pesan di bawah!
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
                                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${isMe
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                                    }`}>
                                    <p className="leading-relaxed break-words">{msg.message}</p>
                                    <span className={`text-[8px] block text-right mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
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
                      /* CONVERSATIONS LIST VIEW */
                      <>
                        {/* Search bar inside popup */}
                        <div className="p-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 flex items-center relative">
                          <Search className="size-3.5 absolute left-6 text-slate-400" />
                          <input
                            placeholder="Cari percakapan..."
                            className="h-8 w-full rounded-lg pl-8 text-xs bg-slate-50 dark:bg-slate-950 border-none outline-none px-3 py-2"
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                          {filteredChatConvs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                              <MessageCircle className="size-8 text-slate-300" />
                              <span>Belum ada obrolan</span>
                            </div>
                          ) : (
                            filteredChatConvs.map((conv) => {
                              const otherUser = getOtherUserInConv(conv)
                              return (
                                <button
                                  key={conv.id_conversation}
                                  onClick={() => handleOpenConversation(conv)}
                                  className="w-full p-3.5 flex gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition items-start bg-transparent border-none cursor-pointer"
                                >
                                  <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
                                    <span className="text-white text-xs font-bold">
                                      {otherUser?.nama?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline gap-2">
                                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{otherUser?.nama}</h5>
                                      <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                      {conv.last_message || 'Belum ada pesan'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                      <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5">
                                        {conv.unread_count} Pesan Baru
                                      </span>
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
                      className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 items-center"
                    >
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 h-9 rounded-xl text-xs bg-slate-50 border-none dark:bg-slate-950 px-3 py-2 outline-none"
                        disabled={sendingMsg}
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !chatInput.trim()}
                        className="size-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md border-none flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        {sendingMsg ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Auth section */}
          {isLoading ? (
            <div className="h-8 w-24 rounded-full bg-white/10 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="relative user-menu ml-2">
              {/* Profile trigger — click to open dropdown */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer transition-opacity duration-300 hover:opacity-80 p-0"
              >
                {getProfilePhotoUrl() ? (
                  <img src={getProfilePhotoUrl()} alt={user?.nama} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 bg-sp-primary rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getUserInitials()}
                  </div>
                )}
                <span className="text-sm font-medium text-white max-w-[120px] truncate">{user?.nama}</span>
                <svg className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[1100]"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.nama}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      {/* Lihat Profile */}
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors no-underline"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="size-4 text-gray-400" />
                        {t('nav.viewProfile')}
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 bg-sp-primary text-white py-2.5 px-6 rounded-full text-sm font-semibold no-underline transition-all duration-300 ease-in-out ml-2 hover:bg-[rgb(26,122,77)] hover:-translate-y-0.5 group"
            >
              {t('nav.login')}
              <img src={arrowRight} alt="" className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`hidden max-md:flex flex-col gap-[5px] bg-transparent p-2 border-none cursor-pointer mr-5`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-white rounded-sm transition-all duration-300 ease-in-out ${mobileOpen ? 'rotate-45 translate-x-[5px] translate-y-[5px]' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white rounded-sm transition-all duration-300 ease-in-out ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white rounded-sm transition-all duration-300 ease-in-out ${mobileOpen ? '-rotate-45 translate-x-[5px] -translate-y-[5px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu Content */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="overflow-hidden bg-black/95 backdrop-blur-[12px] rounded-b-2xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col gap-3 py-5 px-[30px] list-none m-0">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`text-sm font-medium tracking-[0.3px] no-underline
                      ${isActiveLink(link.href) ? 'text-emerald-300' : 'text-white hover:text-emerald-300'}
                    `}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 px-[30px] pb-6">
              <button className="relative bg-transparent p-2 flex items-center justify-center rounded border-none cursor-pointer transition-colors duration-300 ease-in-out hover:bg-white/10" aria-label="Cart" onClick={handleCartClick}>
                <img src={cartIcon} alt="Cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-black pointer-events-none shadow-lg">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              <NotificationBell variant="navbar" additionalNotifications={rentalNotifications} />

              {/* Chat di Mobile - popup instead of navigate */}
              <button
                onClick={handleChatClick}
                className="relative bg-transparent p-2 flex items-center justify-center rounded border-none cursor-pointer transition-colors duration-300 ease-in-out hover:bg-white/10"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border border-black animate-bounce pointer-events-none">
                    {unreadChats}
                  </span>
                )}
              </button>

              {/* Mobile Auth Section */}
              {isAuthenticated ? (
                <>
                  {/* User profile link — mobile */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 w-full mt-2 p-3 bg-white/10 rounded-lg no-underline transition-colors hover:bg-white/15"
                    onClick={() => setMobileOpen(false)}
                  >
                    {getProfilePhotoUrl() ? (
                      <img src={getProfilePhotoUrl()} alt={user?.nama} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-sp-primary rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-white text-sm font-semibold truncate">{user?.nama}</span>
                      <span className="text-gray-400 text-xs truncate">{user?.email}</span>
                    </div>
                  </Link>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 bg-white/10 text-white py-2.5 px-4 rounded-full text-sm font-semibold w-full hover:bg-white/20 no-underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="size-4" />
                    {t('nav.viewProfile')}
                  </Link>

                  {/* Logout - mobile */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 px-6 rounded-full text-sm font-semibold w-full hover:bg-red-700"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 bg-sp-primary text-white py-2.5 px-6 rounded-full text-sm font-semibold w-full mt-2 hover:bg-[rgb(26,122,77)] hover:-translate-y-0.5 group no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('nav.login')}
                  <img src={arrowRight} alt="" className="w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}