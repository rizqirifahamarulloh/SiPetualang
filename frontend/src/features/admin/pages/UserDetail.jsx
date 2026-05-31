import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, MapPin, CalendarDays, ShieldCheck, User, Building, Shield, Package, CreditCard, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import EditUserModal from "../components/EditUserModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { getStorageUrl } from '@/utils/storageUrl';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const getRoleLabel = (role) => {
  const map = { customer: 'Customer', perental: 'Perental', admin: 'Admin' };
  return map[role] || role || '-';
};

const getRoleBadge = (role) => {
  const map = {
    customer: 'bg-blue-50 text-blue-700 border-blue-200',
    perental: 'bg-orange-50 text-orange-700 border-orange-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return map[role] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const STATUS_MAP = {
  menunggu_pembayaran: { label: 'Menunggu', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  dibayar: { label: 'Dibayar', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  sedang_disewa: { label: 'Disewa', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  selesai: { label: 'Selesai', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  dibatalkan: { label: 'Dibatalkan', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loadingTrx, setLoadingTrx] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserById(id);
      setUser(response.data?.data || response.data);
    } catch (error) {
      console.error("Error fetching user detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTrx(true);
      const response = await adminService.getAllTransactions();
      const allTrx = response.data || [];
      // Filter transactions for this user (as penyewa or pemilik)
      const userTrx = allTrx.filter(t => 
        String(t.id_penyewa) === String(id) || String(t.id_pemilik) === String(id)
      );
      setTransactions(userTrx);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTrx(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span className="text-muted-foreground">Memuat detail pengguna...</span>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Pengguna tidak ditemukan.</div>;
  }

  const totalSpend = transactions.reduce((sum, t) => sum + Number(t.total_biaya || 0), 0);

  // Profile info fields — all dynamic
  const profileFields = [
    { icon: Mail, label: 'Email', value: user.email || '-' },
    { icon: Phone, label: 'Telepon', value: user.no_telp || '-' },
    { icon: Calendar, label: 'Tanggal Lahir', value: formatDate(user.tanggal_lahir) },
    { icon: MapPin, label: 'Alamat', value: user.alamat || '-' },
    { icon: Building, label: 'Kota', value: user.kota || '-' },
    { icon: CalendarDays, label: 'Tanggal Daftar', value: formatDateTime(user.created_at) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Detail Pengguna</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="text-emerald-700 border-emerald-500 hover:bg-emerald-50 bg-card rounded-full px-6"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={16} className="mr-2" /> Edit
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 border-none"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={16} className="mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil Pengguna */}
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-20 w-20 rounded-xl">
                {user.profile_photo && (
                  <AvatarImage src={getStorageUrl(user.profile_photo)} className="rounded-xl object-cover" />
                )}
                <AvatarFallback className="bg-emerald-800 text-white text-3xl font-semibold rounded-xl">
                  {getInitials(user.nama)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold mb-2">{user.nama}</h2>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={`font-normal ${getRoleBadge(user.peran_pengguna)}`}>
                    <Shield size={10} className="mr-1" /> {getRoleLabel(user.peran_pengguna)}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                    Akun Aktif
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 text-sm">
              {profileFields.map((field, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    <field.icon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{field.label}</p>
                    <p className={`font-medium truncate ${field.value === '-' ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verifikasi Identitas */}
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Verifikasi Identitas</h3>
              {user.is_verified ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                  <ShieldCheck size={12} className="mr-1" /> KTP Terverifikasi
                </Badge>
              ) : user.verification_status === 'pending' ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">
                  <Clock size={12} className="mr-1" /> Menunggu Verifikasi
                </Badge>
              ) : user.verification_status === 'rejected' ? (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
                  <XCircle size={12} className="mr-1" /> Ditolak
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-normal">
                  Belum Mengajukan
                </Badge>
              )}
            </div>
            
            {/* KTP Preview */}
            <div className="bg-muted/30 border border-muted-foreground/10 rounded-xl mb-4 h-32 flex items-center justify-center relative overflow-hidden">
              {user.ktp_photo ? (
                <img src={getStorageUrl(user.ktp_photo)} alt="KTP" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-50 blur-sm"></div>
                  <div className="z-10 flex flex-col items-center opacity-60 text-muted-foreground">
                     <ShieldCheck size={24} className="mb-2" />
                     <span className="text-xs font-medium uppercase tracking-widest">
                       {user.is_verified ? 'Identitas Terverifikasi' : 'Belum Ada KTP'}
                     </span>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/30 p-3 rounded-xl">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold mb-1">Tanggal Daftar</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-xl">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold mb-1">Terverifikasi Pada</p>
                <p className="font-medium">{user.is_verified ? formatDate(user.verified_at || user.updated_at) : '-'}</p>
              </div>
            </div>

            {user.verification_note && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-200 text-xs text-amber-700">
                <strong>Catatan:</strong> {user.verification_note}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Transaksi */}
      <Card className="border shadow-sm">
        <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-600" />
          <h3 className="font-bold text-lg">Riwayat Transaksi</h3>
          <Badge variant="outline" className="ml-auto text-xs">{transactions.length} transaksi</Badge>
        </div>

        {loadingTrx ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
            <span className="text-sm text-muted-foreground">Memuat transaksi...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada transaksi untuk pengguna ini</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-semibold text-muted-foreground h-11">ID Transaksi</TableHead>
                  <TableHead className="font-semibold text-muted-foreground h-11">Tanggal</TableHead>
                  <TableHead className="font-semibold text-muted-foreground h-11">Barang</TableHead>
                  <TableHead className="font-semibold text-muted-foreground h-11">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground h-11 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((trx) => {
                  const statusCfg = STATUS_MAP[trx.status_sewa] || { label: trx.status_sewa, cls: '' };
                  return (
                    <TableRow key={trx.id_transaksi}>
                      <TableCell className="font-medium font-mono text-xs">{trx.midtrans_order_id || `TRX-${trx.id_transaksi}`}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(trx.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{trx.nama_barang}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal text-xs px-2 py-0 ${statusCfg.cls}`}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatRupiah(trx.total_biaya)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Summary Footer */}
            <div className="bg-muted border-t p-6 flex justify-end gap-16 rounded-b-xl">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Transaksi</p>
                <p className="font-bold text-xl">{transactions.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Belanja</p>
                <p className="font-bold text-xl text-emerald-800">{formatRupiah(totalSpend)}</p>
              </div>
            </div>
          </>
        )}
      </Card>

      <EditUserModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={user}
        onSave={async (updatedUser) => {
          try {
            await adminService.updateUser(user.id_pengguna, {
              nama: updatedUser.nama,
              email: updatedUser.email,
              no_telp: updatedUser.telepon,
              alamat: updatedUser.alamat,
              peran_pengguna: updatedUser.peran
            });
            fetchUser(); // Re-fetch to get latest data
          } catch (err) {
            console.error("Failed to update user", err);
            alert("Gagal mengupdate user");
          }
        }}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            await adminService.deleteUser(user.id_pengguna);
            navigate('/admin/users');
          } catch (err) {
            console.error("Gagal hapus", err);
            alert("Gagal menghapus user");
            setIsDeleteModalOpen(false);
          }
        }}
        itemName={user?.nama || "User ini"}
      />
    </div>
  );
}
