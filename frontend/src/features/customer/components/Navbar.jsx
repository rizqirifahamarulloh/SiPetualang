// src/profile/components/Navbar.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft, MessageCircle, Search, ArrowLeft, Send, Loader2 } from 'lucide-react';
import logoImg from '@/assets/beranda/Logo.png';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({
  hideNotificationChat = false,
  // Rental mode props
  rentalMode = false,
  additionalNotifications = [],
  onChatWithCustomer = null
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [unreadChats, setUnreadChats] = useState(0);

  // Chat popup states (for rental mode)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatConversations, setChatConversations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSearch, setChatSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadChats = async () => {
      try {
        const res = await api.get('/customer/chat/conversations');
        const convs = res.data.data || [];
        const totalUnread = convs.reduce((sum, item) => sum + (item.unread_count || 0), 0);
        setUnreadChats(totalUnread);
      } catch (err) {
        console.error('Gagal mengambil data chat:', err);
      }
    };

    fetchUnreadChats();
    const interval = setInterval(fetchUnreadChats, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // === Rental Chat Popup Helpers ===
  const getOtherUserInConv = (conv) => {
    if (!user) return null;
    const myId = user.id || user.id_pengguna;
    return Number(conv.id_user_a) === Number(myId) ? conv.user_b : conv.user_a;
  };

  const fetchConversationsList = async () => {
    try {
      const res = await api.get('/customer/chat/conversations');
      setChatConversations(res.data.data || []);
    } catch (err) {
      console.error("Gagal memuat percakapan:", err);
    }
  };

  const fetchChatMessages = async (conversationId, silent = false) => {
    if (!conversationId) return;
    try {
      if (!silent) setChatLoading(true);
      const res = await api.get(`/customer/chat/messages/${conversationId}`);
      const messagesData = res.data.data?.messages || [];
      setChatMessages(messagesData);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const fetchUnreadChatsCount = async () => {
    try {
      const res = await api.get('/customer/chat/conversations');
      const convs = res.data.data || [];
      const totalUnread = convs.reduce((sum, item) => sum + (item.unread_count || 0), 0);
      setUnreadChats(totalUnread);
    } catch (err) {
      console.error('Gagal mengambil data chat:', err);
    }
  };

  const handleOpenConversation = (conv) => {
    const otherUser = getOtherUserInConv(conv);
    setActiveChatId(conv.id_conversation);
    setActiveChatUser(otherUser);
    fetchChatMessages(conv.id_conversation);
  };

  const handleSendQuickMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId || sendingMsg) return;

    const text = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    const myId = user.id || user.id_pengguna;
    const tempMsg = {
      id_message: Date.now(),
      id_sender: myId,
      message: text,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setChatMessages(prev => [...prev, tempMsg]);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      await api.post('/customer/chat/message', {
        id_conversation: activeChatId,
        message: text
      });
      await fetchChatMessages(activeChatId, true);
      fetchConversationsList();
      fetchUnreadChatsCount();
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      setChatMessages(prev => prev.filter(m => m.id_message !== tempMsg.id_message));
    } finally {
      setSendingMsg(false);
    }
  };

  // Click outside to close chat popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
        if (event.target.closest('.chat-trigger-btn') || event.target.classList.contains('chat-trigger-btn')) {
          return;
        }
        setIsChatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatContainerRef]);

  // Polling for active chat messages
  useEffect(() => {
    if (!isChatOpen) return;

    const interval = setInterval(() => {
      fetchConversationsList();
      if (activeChatId) {
        fetchChatMessages(activeChatId, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isChatOpen, activeChatId]);

  const filteredChatConvs = useMemo(() => {
    if (!chatSearch.trim()) return chatConversations;
    return chatConversations.filter(conv => {
      const otherUser = getOtherUserInConv(conv);
      return otherUser?.nama?.toLowerCase().includes(chatSearch.toLowerCase());
    });
  }, [chatConversations, chatSearch, user]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-black shadow-md">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="SiPetualang" className="h-8 w-auto" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-white hover:text-emerald-300 transition">Beranda</Link>
            <Link to="/sewa-alat" className="text-sm text-white hover:text-emerald-300 transition">Sewa Alat</Link>
            <Link to="/cara-sewa" className="text-sm text-white hover:text-emerald-300 transition">Cara Sewa</Link>
            <Link to={user?.peran_pengguna === 'perental' || user?.rental === 'true' ? '/rental-dashboard' : '/buka-rental'} className="text-sm text-white hover:text-emerald-300 transition">{user?.peran_pengguna === 'perental' || user?.rental === 'true' ? 'Buka Dashboard' : 'Buka Rental'}</Link>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {!hideNotificationChat && !rentalMode && (
              <>
                <NotificationBell variant="navbar" />
                <div className="relative" ref={!rentalMode ? chatContainerRef : undefined}>
                  <button
                    onClick={() => {
                      const nextOpen = !isChatOpen;
                      setIsChatOpen(nextOpen);
                      if (nextOpen) {
                        fetchConversationsList();
                      }
                    }}
                    className="relative p-2 text-white hover:text-emerald-300 transition duration-200 bg-transparent border-none cursor-pointer"
                    title="Pesan"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  {unreadChats > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-bounce pointer-events-none">
                      {unreadChats}
                    </span>
                  )}

                  {/* FLOATING MINI CHAT WIDGET */}
                  <AnimatePresence>
                    {isChatOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-[360px] h-[480px] rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-50"
                      >
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center gap-3">
                          {activeChatId ? (
                            <>
                              <button
                                onClick={() => {
                                  setActiveChatId(null);
                                  setActiveChatUser(null);
                                  setChatMessages([]);
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
                            chatLoading ? (
                              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                                <Loader2 className="size-6 animate-spin text-emerald-600" />
                                <span>Memuat obrolan...</span>
                              </div>
                            ) : (
                              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {chatMessages.length === 0 ? (
                                  <div className="text-center text-xs text-muted-foreground py-8">
                                    Belum ada pesan. Mulai kirim pesan di bawah!
                                  </div>
                                ) : (
                                  chatMessages.map((msg) => {
                                    const myId = user.id || user.id_pengguna;
                                    const isMe = msg.id_sender === myId;
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
                                    );
                                  })
                                )}
                                <div ref={chatEndRef} />
                              </div>
                            )
                          ) : (
                            <>
                              <div className="p-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900 flex items-center relative">
                                <Search className="size-3.5 absolute left-6 text-slate-400" />
                                <Input
                                  placeholder="Cari percakapan..."
                                  className="h-8 rounded-lg pl-8 text-xs bg-slate-50 dark:bg-slate-950 border-none outline-none"
                                  value={chatSearch}
                                  onChange={(e) => setChatSearch(e.target.value)}
                                />
                              </div>

                              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                                {filteredChatConvs.length === 0 ? (
                                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <MessageCircle className="size-8 text-slate-300" />
                                    <span>Belum ada obrolan</span>
                                  </div>
                                ) : (
                                  filteredChatConvs.map((conv) => {
                                    const otherUser = getOtherUserInConv(conv);
                                    return (
                                      <button
                                        key={conv.id_conversation}
                                        onClick={() => handleOpenConversation(conv)}
                                        className="w-full p-3.5 flex gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition items-start bg-transparent border-none cursor-pointer"
                                      >
                                        <Avatar className="size-9 rounded-xl shadow-sm shrink-0 ring-2 ring-emerald-500/10">
                                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-bold">
                                            {otherUser?.nama?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
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
                                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 scale-75 mt-1.5 -ml-1">
                                              {conv.unread_count} Pesan Baru
                                            </Badge>
                                          )}
                                        </div>
                                      </button>
                                    );
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
                            <Input
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ketik pesan..."
                              className="flex-1 h-9 rounded-xl text-xs bg-slate-50 border-none dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500"
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
              </>
            )}

            {/* Rental Mode: Notification + Chat Popup in Navbar */}
            {rentalMode && (
              <>
                {/* Notification Bell - navbar variant for black navbar */}
                <NotificationBell variant="navbar" additionalNotifications={additionalNotifications} />

                {/* Chat Popup Button - same style as Beranda */}
                <div className="relative" ref={chatContainerRef}>
                  <button
                    onClick={() => {
                      const nextOpen = !isChatOpen;
                      setIsChatOpen(nextOpen);
                      if (nextOpen) {
                        fetchConversationsList();
                      }
                    }}
                    className="relative p-2 text-white hover:text-emerald-300 transition duration-200 bg-transparent border-none cursor-pointer"
                    title="Pesan Customer"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  {unreadChats > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-bounce pointer-events-none">
                      {unreadChats}
                    </span>
                  )}

                  {/* FLOATING MINI CHAT WIDGET */}
                  <AnimatePresence>
                    {isChatOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-[360px] h-[480px] rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col z-50"
                      >
                        {/* HEADER */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center gap-3">
                          {activeChatId ? (
                            <>
                              <button
                                onClick={() => {
                                  setActiveChatId(null);
                                  setActiveChatUser(null);
                                  setChatMessages([]);
                                }}
                                className="size-8 hover:bg-white/10 rounded-lg text-white flex items-center justify-center bg-transparent border-none cursor-pointer"
                              >
                                <ArrowLeft className="size-4" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{activeChatUser?.nama}</h4>
                                <p className="text-[10px] text-emerald-100 truncate">{activeChatUser?.kota || 'Penyewa'}</p>
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
                                <h4 className="font-bold text-sm">Pesan Customer</h4>
                                <p className="text-[10px] text-emerald-100">Hubungi customer secara langsung</p>
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
                                    const myId = user.id || user.id_pengguna;
                                    const isMe = msg.id_sender === myId;
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
                                    );
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
                                <Input
                                  placeholder="Cari customer..."
                                  className="h-8 rounded-lg pl-8 text-xs bg-slate-50 dark:bg-slate-950 border-none outline-none"
                                  value={chatSearch}
                                  onChange={(e) => setChatSearch(e.target.value)}
                                />
                              </div>

                              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                                {filteredChatConvs.length === 0 ? (
                                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <MessageCircle className="size-8 text-slate-300" />
                                    <span>Tidak ada obrolan</span>
                                  </div>
                                ) : (
                                  filteredChatConvs.map((conv) => {
                                    const otherUser = getOtherUserInConv(conv);
                                    return (
                                      <button
                                        key={conv.id_conversation}
                                        onClick={() => handleOpenConversation(conv)}
                                        className="w-full p-3.5 flex gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition items-start bg-transparent border-none cursor-pointer"
                                      >
                                        <Avatar className="size-9 rounded-xl shadow-sm shrink-0 ring-2 ring-emerald-500/10">
                                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-bold">
                                            {otherUser?.nama?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
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
                                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 scale-75 mt-1.5 -ml-1">
                                              {conv.unread_count} Pesan Baru
                                            </Badge>
                                          )}
                                        </div>
                                      </button>
                                    );
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
                            <Input
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Ketik balasan cepat..."
                              className="flex-1 h-9 rounded-xl text-xs bg-slate-50 border-none dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500"
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
              </>
            )}

            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-white hover:text-emerald-300 hover:bg-white/10">
                <ChevronLeft size={16} />
                Kembali
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm py-2 text-white hover:text-emerald-300 transition">Beranda</Link>
              <Link to="/sewa-alat" className="text-sm py-2 text-white hover:text-emerald-300 transition">Sewa Alat</Link>
              <Link to="/cara-sewa" className="text-sm py-2 text-white hover:text-emerald-300 transition">Cara Sewa</Link>
              <Link to={user?.peran_pengguna === 'perental' || user?.rental === 'true' ? '/rental-dashboard' : '/buka-rental'} className="text-sm py-2 text-white hover:text-emerald-300 transition">{user?.peran_pengguna === 'perental' || user?.rental === 'true' ? 'Buka Dashboard' : 'Buka Rental'}</Link>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex gap-4 items-center">
                  {!hideNotificationChat && !rentalMode && (
                    <>
                      <NotificationBell variant="navbar" />
                      <button
                        onClick={() => {
                          const nextOpen = !isChatOpen;
                          setIsChatOpen(nextOpen);
                          if (nextOpen) fetchConversationsList();
                        }}
                        className="relative p-2 text-white hover:text-emerald-300 transition bg-transparent border-none cursor-pointer"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {unreadChats > 0 && (
                          <span className="absolute top-0 right-0 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-bounce pointer-events-none">
                            {unreadChats}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                  {rentalMode && (
                    <>
                      <NotificationBell variant="navbar" additionalNotifications={additionalNotifications} />
                      <button
                        onClick={() => {
                          setIsChatOpen(!isChatOpen);
                          if (!isChatOpen) fetchConversationsList();
                        }}
                        className="relative p-2 text-white hover:text-emerald-300 transition bg-transparent border-none cursor-pointer"
                      >
                        <MessageCircle className="h-5 w-5" />
                        {unreadChats > 0 && (
                          <span className="absolute top-0 right-0 flex h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full animate-bounce pointer-events-none">
                            {unreadChats}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2 text-white hover:text-emerald-300 hover:bg-white/10">
                    <ChevronLeft size={16} />
                    Kembali
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}