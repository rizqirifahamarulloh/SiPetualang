import { useEffect, useState } from "react";
import TablePagination, { paginateArray } from "@/components/TablePagination";
import { useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, ShieldCheck, Users as UsersIcon, PersonStanding, Briefcase, ClipboardList, ChevronLeft, ChevronRight, MoreHorizontal, KeyRound, Trash2, Edit } from "lucide-react";
import EditUserModal from "../components/EditUserModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total_users: 1240,
    penyewa: 856,
    pemilik: 384,
    verifikasi_tertunda: 42
  });

  const getUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers();
      const usersData = response.data?.data?.data || response.data?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.log(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    try {
      const response = await adminService.getStats();
      if (response.data?.stats) {
        setStats(prev => ({
          ...prev,
          total_users: response.data.stats.total_users,
          penyewa: response.data.stats.total_customers,
          pemilik: response.data.stats.total_users - response.data.stats.total_customers
        }));
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getUsers();
    getStats();
  }, []);

  const resetPassword = async (userId) => {
    if (!confirm("Reset password untuk user ini?")) return;
    try {
      await adminService.resetPassword(userId);
      alert("Password berhasil direset");
    } catch (err) {
      console.log(err);
      alert("Gagal reset password");
    }
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      await adminService.deleteUser(userToDelete.id_pengguna);
      // alert("User berhasil dihapus"); // Bisa diganti toast
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      getUsers();
      getStats();
    } catch (err) {
      console.log(err);
      alert("Gagal hapus user");
      setIsDeleteModalOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Dashboard &gt; <span className="text-foreground font-medium">Manajemen Pengguna</span></p>
        <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Pengguna</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg"><UsersIcon size={18} /></div>
            </div>
            <h2 className="text-3xl font-bold">{stats.total_users.toLocaleString()}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Penyewa Aktif</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg"><PersonStanding size={18} /></div>
            </div>
            <h2 className="text-3xl font-bold">{stats.penyewa.toLocaleString()}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Pemilik Gear</p>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-lg"><Briefcase size={18} /></div>
            </div>
            <h2 className="text-3xl font-bold">{stats.pemilik.toLocaleString()}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Verifikasi Tertunda</p>
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 rounded-lg"><ClipboardList size={18} /></div>
            </div>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-bold">{stats.verifikasi_tertunda}</h2>
              <span className="text-sm text-red-500 mb-1 font-medium flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                +12 hari ini
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 items-center bg-card rounded-t-xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input className="pl-9 bg-muted/50" placeholder="Cari pengguna..." />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} /> Filter Peran
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <ShieldCheck size={16} /> Status KTP
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status KTP</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Memuat data users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada pengguna.
                  </TableCell>
                </TableRow>
              ) : (
                paginateArray(users, currentPage, PER_PAGE).map((user, index) => (
                  <TableRow key={user.id_pengguna}>
                    <TableCell className="text-center text-muted-foreground">{(currentPage - 1) * PER_PAGE + index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(user.nama)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className="text-sm">{user.peran_pengguna === 'customer' ? 'Penyewa' : 'Admin'}</span>
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span> Terverifikasi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 font-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-2"></span> Menunggu
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      10 Okt 2023
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id_pengguna}`)}>
                            <ClipboardList className="mr-2" size={14} />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingUser(user);
                            setIsEditModalOpen(true);
                          }}>
                            <Edit className="mr-2" size={14} />
                            Edit Data
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resetPassword(user.id_pengguna)}>
                            <KeyRound className="mr-2" size={14} />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}>
                            <Trash2 className="mr-2" size={14} />
                            Hapus User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={users.length}
          perPage={PER_PAGE}
          onPageChange={setCurrentPage}
          label="pengguna"
        />
      </Card>
      <EditUserModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={editingUser}
        onSave={async (updatedUser) => {
          try {
            await adminService.updateUser(editingUser.id_pengguna, {
              nama: updatedUser.nama,
              email: updatedUser.email,
              no_telp: updatedUser.telepon,
              alamat: updatedUser.alamat,
              peran_pengguna: updatedUser.peran
            });
            getUsers();
          } catch (err) {
            console.error("Failed to update user", err);
            alert("Gagal mengupdate user");
          }
        }}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        itemName={userToDelete?.nama || "User ini"}
      />
    </div>
  );
}