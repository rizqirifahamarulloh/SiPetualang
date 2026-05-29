import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, MapPin, CalendarDays, ShieldCheck } from "lucide-react";
import EditUserModal from "../components/EditUserModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
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
    fetchUser();
  }, [id]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Memuat detail pengguna...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Pengguna tidak ditemukan.</div>;
  }

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
                <AvatarFallback className="bg-emerald-800 text-white text-3xl font-semibold rounded-xl">
                  {getInitials(user.nama)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold mb-2">{user.nama}</h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-normal">
                    {user.peran_pengguna === 'admin' ? 'Admin' : 'Renter'}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                    Active Account
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={16} className="shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone size={16} className="shrink-0" />
                <span>{user.no_telp || '081234567890'}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar size={16} className="shrink-0" />
                <span>1995-04-12</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin size={16} className="shrink-0" />
                <span>{user.kota || 'Depok'}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <CalendarDays size={16} className="shrink-0" />
                <span>Joined 2024-01-15</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verifikasi Identitas */}
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Identity Verification</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal">
                <ShieldCheck size={12} className="mr-1" /> KTP Verified
              </Badge>
            </div>
            
            <div className="bg-muted/30 border border-muted-foreground/10 rounded-xl mb-4 h-32 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-50 blur-sm"></div>
              {/* Fake ID Card visual representation */}
              <div className="z-10 flex flex-col items-center opacity-60 text-muted-foreground">
                 <ShieldCheck size={24} className="mb-2" />
                 <span className="text-xs font-medium uppercase tracking-widest">Secure Identity</span>
              </div>
            </div>

            <div className="flex gap-12 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Application Date</p>
                <p className="font-medium">2024-01-15</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Verification Date</p>
                <p className="font-medium">2024-01-16</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-border flex gap-6 px-2 mt-8">
        <button className="pb-3 text-sm font-semibold border-b-2 border-emerald-700 text-emerald-800">
          Riwayat Transaksi
        </button>
        <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          Riwayat Deposit
        </button>
      </div>

      {/* Transactions Table */}
      <Card className="mt-6 border border-border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="font-semibold text-muted-foreground h-11">Transaction ID</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-11">Date</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-11">Items</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-11">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground h-11 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">TRX-001</TableCell>
              <TableCell className="text-muted-foreground">2024-02-10</TableCell>
              <TableCell className="text-muted-foreground">2x Tent 4P, 1x Stove</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal text-xs px-2 py-0">Completed</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">Rp 450.000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">TRX-002</TableCell>
              <TableCell className="text-muted-foreground">2024-03-05</TableCell>
              <TableCell className="text-muted-foreground">1x Carrier 60L, 2x Sleeping Bag</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-normal text-xs px-2 py-0">Active</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">Rp 200.000</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Summary Footer */}
        <div className="bg-muted border-t p-6 flex justify-end gap-16 rounded-b-xl">
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
            <p className="font-bold text-xl">2</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Total Spend</p>
            <p className="font-bold text-xl text-emerald-800">Rp 650.000</p>
          </div>
        </div>
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
            // Update local state to reflect changes without a full refetch
            setUser(prev => ({
              ...prev,
              nama: updatedUser.nama,
              email: updatedUser.email,
              no_telp: updatedUser.telepon,
              alamat: updatedUser.alamat,
              peran_pengguna: updatedUser.peran
            }));
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
