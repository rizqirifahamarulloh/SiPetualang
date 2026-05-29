import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, X, AlertCircle, CheckCircle, InfoIcon, Trash2, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/contexts/AuthContext'

// Category filter configuration
const FILTER_CATEGORIES = {
  semua: { label: 'Semua', types: null },
  umum: {
    label: 'Umum',
    types: ['verification', 'admin_verification'],
    description: 'Verifikasi akun, status KTP, dll.'
  },
  transaksi: {
    label: 'Transaksi',
    types: ['transaction', 'payment', 'shipping', 'return'],
    description: 'Order, pembayaran, pengiriman'
  },
  refund: {
    label: 'Refund',
    types: ['return_request', 'return_approved', 'return_rejected', 'refund_completed'],
    description: 'Pengajuan pengembalian & refund'
  },
  barang: {
    label: 'Barang',
    types: ['stock_warning', 'gear_approval', 'barang_status', 'barang_approval'],
    description: 'Stok, approval barang rental'
  },
}

export default function NotificationBell({ variant = 'default', additionalNotifications = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('semua')
  const [clearingAll, setClearingAll] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications()
      if (response.status === 'success') {
        setNotifications(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const loadNotifications = async () => {
      await fetchNotifications()
    }

    loadNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const nextOpen = !isOpen
    setIsOpen(nextOpen)

    if (nextOpen) {
      await fetchNotifications()
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((current) => current.filter((notif) => notif.id_notifikasi !== id))
    } catch (error) {
      console.error('Gagal menghapus notifikasi:', error)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Hapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.')) return
    
    setClearingAll(true)
    try {
      await notificationService.clearAllNotifications()
      setNotifications([])
    } catch (error) {
      console.error('Gagal menghapus semua notifikasi:', error)
    } finally {
      setClearingAll(false)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((notif) => !notif.is_read)
    if (!unread.length) {
      return
    }

    try {
      await Promise.all(unread.map((notif) => notificationService.markNotificationRead(notif.id_notifikasi)))
      await fetchNotifications()
    } catch (error) {
      console.error('Gagal menandai notifikasi sebagai dibaca:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'info':
      default:
        return <InfoIcon className="w-4 h-4 text-blue-500" />
    }
  }

  const mergedNotifications = useMemo(() => {
    return [
      ...notifications,
      ...additionalNotifications
    ]
      .map((notif) => ({
        ...notif,
        created_at: notif.created_at ? new Date(notif.created_at).toISOString() : new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [notifications, additionalNotifications])

  // Apply filter
  const filteredNotifications = useMemo(() => {
    const filterConfig = FILTER_CATEGORIES[activeFilter]
    if (!filterConfig || !filterConfig.types) return mergedNotifications
    return mergedNotifications.filter((notif) => filterConfig.types.includes(notif.type))
  }, [mergedNotifications, activeFilter])

  const unreadFiltered = filteredNotifications.filter((notif) => !notif.is_read)
  const readFiltered = filteredNotifications.filter((notif) => notif.is_read)
  const totalUnread = mergedNotifications.filter((notif) => !notif.is_read).length

  // Count per filter for badge
  const filterCounts = useMemo(() => {
    const counts = {}
    Object.entries(FILTER_CATEGORIES).forEach(([key, config]) => {
      if (!config.types) {
        counts[key] = mergedNotifications.length
      } else {
        counts[key] = mergedNotifications.filter((n) => config.types.includes(n.type)).length
      }
    })
    return counts
  }, [mergedNotifications])

  // Render a single notification card
  const renderNotifCard = (notif) => (
    <div
      key={notif.id_notifikasi || notif.unique_key}
      className={`relative rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${getSeverityColor(notif.severity)}`}
    >
      <div className="absolute right-3 top-3 flex gap-2">
        {notif.id_notifikasi && (
          <button
            onClick={() => handleDelete(notif.id_notifikasi)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Hapus notifikasi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{getSeverityIcon(notif.severity)}</div>
        <div className="min-w-0 pr-6">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{notif.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-gray-400">{new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            {notif.type && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium capitalize">
                {notif.type.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`relative ${variant === 'navbar' ? '' : ''}`}>
      <button
        onClick={handleToggle}
        className={`relative flex items-center justify-center rounded transition-colors duration-300 ease-in-out
          ${variant === 'navbar'
            ? 'bg-transparent p-2 border-none cursor-pointer hover:bg-white/10 text-white'
            : variant === 'light'
            ? 'bg-transparent p-2 border-none cursor-pointer hover:bg-gray-100 text-gray-600 hover:text-emerald-600'
            : 'bg-white/10 p-2.5 hover:bg-white/20 text-white'
          }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[420px] max-h-[600px] overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 z-50"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="size-4 text-emerald-600" />
                    Notifikasi
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Riwayat notifikasi real-time</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {mergedNotifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      disabled={clearingAll}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                      title="Hapus semua notifikasi"
                    >
                      <Trash2 className="size-3" />
                      {clearingAll ? 'Menghapus...' : 'Hapus Semua'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
                {Object.entries(FILTER_CATEGORIES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeFilter === key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {config.label}
                    {filterCounts[key] > 0 && (
                      <span className={`text-[9px] min-w-4 h-4 flex items-center justify-center rounded-full px-1 font-bold ${
                        activeFilter === key
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {filterCounts[key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[460px]">
              {loading && mergedNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Memuat notifikasi...</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Silakan login dahulu untuk melihat notifikasi.</p>
                  <Link to="/login" className="inline-flex mt-4 items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Login sekarang
                  </Link>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activeFilter !== 'semua' 
                      ? `Tidak ada notifikasi untuk kategori "${FILTER_CATEGORIES[activeFilter].label}".`
                      : 'Belum ada notifikasi.'
                    }
                  </p>
                  {activeFilter !== 'semua' && (
                    <button 
                      onClick={() => setActiveFilter('semua')}
                      className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      Lihat semua notifikasi →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {/* Unread Section */}
                  {unreadFiltered.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Belum Dibaca ({unreadFiltered.length})
                          </p>
                        </div>
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          Tandai semua dibaca
                        </button>
                      </div>
                      <div className="space-y-2">
                        {unreadFiltered.map(renderNotifCard)}
                      </div>
                    </div>
                  )}

                  {/* Read Section */}
                  {readFiltered.length > 0 && (
                    <div className="space-y-3">
                      {unreadFiltered.length > 0 && (
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-2" />
                      )}
                      <div className="px-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Sudah Dibaca ({readFiltered.length})
                        </p>
                      </div>
                      <div className="space-y-2">
                        {readFiltered.map(renderNotifCard)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
