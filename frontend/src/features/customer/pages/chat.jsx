import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import { API_URL } from '@/services/api';
import {
  Send,
  MessageCircle,
  User,
  Plus,
  Loader2,
  Search,
  ArrowLeft,
} from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  const inputRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const initializedRef = useRef(false);

  const token = localStorage.getItem('token');


  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getOtherUser = useCallback(
    (conv) => {
      if (!user) return null;
      return conv.id_user_a === user.id_pengguna
        ? conv.user_b
        : conv.user_a;
    },
    [user]
  );

  const formatTime = useCallback((date) => {
    if (!date) return '';

    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';

    const d = new Date(date);
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hari Ini';
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    }

    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  // FETCH CONVERSATIONS
  const fetchConversations = useCallback(async () => {
    if (!token) return [];

    try {
      const response = await axios.get(
        `${API_URL}/customer/chat/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data.data || [];
      setConversations(data);

      return data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }, [token]);

  // FETCH MESSAGES
  const fetchMessages = useCallback(
    async (conversationId, isPolling = false) => {
      if (!conversationId) return;

      try {
        const response = await axios.get(
          `${API_URL}/customer/chat/messages/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data.data;
        const newMessages = data.messages || [];

        const lastMessage = newMessages[newMessages.length - 1];

        if (
          isPolling &&
          lastMessage?.id_message === lastMessageIdRef.current
        ) {
          return;
        }

        lastMessageIdRef.current = lastMessage?.id_message;

        setMessages(newMessages);
        setCurrentChat(data.conversation);
      } catch (error) {
        console.error(error);
      }
    },
    [token]
  );

  // FETCH CUSTOMERS
  const fetchCustomers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_URL}/customer/chat/customers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCustomers(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  // LOAD INITIAL
  useEffect(() => {
    const loadData = async () => {
      if (!token || initializedRef.current) return;

      initializedRef.current = true;

      setIsLoading(true);

      const convs = await fetchConversations();
      await fetchCustomers();

      // AUTO OPEN FIRST CHAT TANPA ERROR ESLINT
      if (convs.length > 0) {
        await fetchMessages(convs[0].id_conversation);
      }

      setIsLoading(false);
    };

    loadData();
  }, [token, fetchConversations, fetchCustomers, fetchMessages]);

  // POLLING
  useEffect(() => {
    if (!currentChat?.id_conversation) return;

    pollingInterval.current = setInterval(() => {
      fetchMessages(currentChat.id_conversation, true);
      fetchConversations();
    }, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [currentChat?.id_conversation, fetchMessages, fetchConversations]);

  // START NEW CHAT
  const startNewChat = useCallback(
    async (userId) => {
      try {
        const response = await axios.post(
          `${API_URL}/customer/chat/conversation/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const conv = response.data.data;

        setCurrentChat(conv);

        await fetchMessages(conv.id_conversation);

        await fetchConversations();

        setShowNewChat(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } catch (error) {
        console.error(error);
        alert('Gagal memulai chat');
      }
    },
    [token, fetchMessages, fetchConversations]
  );

  // SEND MESSAGE
  const sendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      if (!newMessage.trim() || !currentChat || sending) return;

      const text = newMessage.trim();

      setNewMessage('');

      const tempMessage = {
        id_message: Date.now(),
        id_sender: user.id_pengguna,
        message: text,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      scrollToBottom();

      setSending(true);

      try {
        await axios.post(
          `${API_URL}/customer/chat/message`,
          {
            id_conversation: currentChat.id_conversation,
            message: text,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await fetchMessages(currentChat.id_conversation);
        await fetchConversations();
      } catch (error) {
        console.error(error);

        setMessages((prev) =>
          prev.filter((msg) => msg.id_message !== tempMessage.id_message)
        );

        setNewMessage(text);

        alert('Gagal mengirim pesan');
      } finally {
        setSending(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [
      newMessage,
      currentChat,
      sending,
      user,
      token,
      fetchMessages,
      fetchConversations,
      scrollToBottom,
    ]
  );

  // FILTER CHAT
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;

    return conversations.filter((conv) =>
      getOtherUser(conv)
        ?.nama?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [conversations, search, getOtherUser]);

  // LOGIN REQUIRED
  if (!user) {
    return (
      <div className="landing-scrollbar">
        <Navbar forceScrolled={true} />

        <div className="min-h-screen flex items-center justify-center pt-32 px-4 bg-gray-50">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full border">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Login Diperlukan
            </h2>

            <p className="text-gray-500 mb-6">
              Silakan login untuk mengakses fitur chat
            </p>

            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition font-medium"
            >
              Login Sekarang
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // LOADING
  if (isLoading) {
    return (
      <div className="landing-scrollbar">
        <Navbar forceScrolled={true} />

        <div className="min-h-screen flex items-center justify-center pt-32 bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Memuat chat...</p>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-scrollbar bg-gray-100 min-h-screen">
      <Navbar forceScrolled={true} />

      <main className="container mx-auto px-3 sm:px-4 pt-28 pb-10">
        <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl border border-gray-100 h-[calc(100vh-140px)]">
          <div className="flex h-full">
            {/* SIDEBAR */}
            <div className="w-full md:w-[360px] border-r bg-white flex flex-col">
              {/* HEADER */}
              <div className="p-5 border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-xl">Pesan</h2>
                    <p className="text-sm text-green-100">
                      Chat dengan pengguna lain
                    </p>
                  </div>

                  <button
                    onClick={() => setShowNewChat(!showNewChat)}
                    className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* SEARCH */}
                <div className="mt-4 relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    placeholder="Cari percakapan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white text-gray-700 rounded-2xl pl-11 pr-4 py-3 outline-none"
                  />
                </div>
              </div>

              {/* NEW CHAT */}
              {showNewChat && (
                <div className="border-b bg-gray-50 p-4">
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">
                    Mulai Chat Baru
                  </h3>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-5">
                        Tidak ada customer
                      </p>
                    ) : (
                      customers.map((customer) => (
                        <button
                          key={customer.id_pengguna}
                          onClick={() =>
                            startNewChat(customer.id_pengguna)
                          }
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white transition border"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>

                          <div className="text-left">
                            <p className="font-semibold text-sm text-gray-800">
                              {customer.nama}
                            </p>

                            <p className="text-xs text-gray-500">
                              {customer.kota || 'Indonesia'}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* LIST CHAT */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />

                    <h3 className="font-semibold text-gray-700 mb-2">
                      Belum Ada Chat
                    </h3>

                    <p className="text-sm text-gray-500">
                      Mulai percakapan baru sekarang
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const otherUser = getOtherUser(conv);

                    const active =
                      currentChat?.id_conversation ===
                      conv.id_conversation;

                    return (
                      <button
                        key={conv.id_conversation}
                        onClick={() =>
                          fetchMessages(conv.id_conversation)
                        }
                        className={`w-full p-4 border-b text-left transition ${
                          active
                            ? 'bg-green-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold truncate text-gray-800">
                                {otherUser?.nama}
                              </h4>

                              <span className="text-[11px] text-gray-400">
                                {formatDate(conv.last_message_at)}
                              </span>
                            </div>

                            <p className="text-sm text-gray-500 truncate mt-1">
                              {conv.last_message ||
                                'Belum ada pesan'}
                            </p>

                            {conv.unread_count > 0 && (
                              <div className="mt-2">
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                  {conv.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* CHAT AREA */}
            <div className="hidden md:flex flex-1 flex-col bg-gray-50">
              {currentChat ? (
                <>
                  {/* HEADER */}
                  <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-800">
                        {getOtherUser(currentChat)?.nama}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {getOtherUser(currentChat)?.kota ||
                          'Indonesia'}
                      </p>
                    </div>
                  </div>

                  {/* MESSAGES */}
                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />

                          <h3 className="font-semibold text-gray-700">
                            Belum Ada Pesan
                          </h3>

                          <p className="text-gray-500 text-sm">
                            Mulai percakapan sekarang
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe =
                          msg.id_sender === user.id_pengguna;

                        const showDate =
                          idx === 0 ||
                          new Date(
                            msg.created_at
                          ).toDateString() !==
                            new Date(
                              messages[idx - 1]?.created_at
                            ).toDateString();

                        return (
                          <div key={msg.id_message}>
                            {showDate && (
                              <div className="flex justify-center mb-5">
                                <span className="bg-white text-gray-500 text-xs px-4 py-2 rounded-full shadow-sm border">
                                  {formatDate(msg.created_at)}
                                </span>
                              </div>
                            )}

                            <div
                              className={`flex ${
                                isMe
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[75%] px-5 py-3 rounded-3xl shadow-sm ${
                                  isMe
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-md'
                                    : 'bg-white text-gray-700 rounded-bl-md border'
                                }`}
                              >
                                <p className="text-sm leading-relaxed break-words">
                                  {msg.message}
                                </p>

                                <p
                                  className={`text-[11px] mt-2 ${
                                    isMe
                                      ? 'text-green-100'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* INPUT */}
                  <form
                    onSubmit={sendMessage}
                    className="bg-white border-t p-4"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) =>
                          setNewMessage(e.target.value)
                        }
                        placeholder="Ketik pesan..."
                        className="flex-1 bg-gray-100 border-0 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500"
                      />

                      <button
                        type="submit"
                        disabled={
                          sending || !newMessage.trim()
                        }
                        className="w-14 h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                  <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <MessageCircle className="w-14 h-14 text-green-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Pilih Percakapan
                  </h2>

                  <p className="text-gray-500 max-w-md">
                    Pilih chat di samping untuk mulai percakapan
                  </p>
                </div>
              )}
            </div>

            {/* MOBILE EMPTY */}
            {!currentChat && (
              <div className="md:hidden hidden"></div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}