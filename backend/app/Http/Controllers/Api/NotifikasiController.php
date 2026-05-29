<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Notifikasi;
use App\Models\Transaksi;
use App\Models\Verifikasi;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 401);
        }

        if ($user->peran_pengguna === 'customer') {
            $this->syncCustomerNotifications($user);
        } elseif ($user->peran_pengguna === 'admin') {
            $this->syncAdminNotifications($user);
        }

        // Only return non-dismissed notifications
        $notifications = Notifikasi::where('id_pengguna', $user->id_pengguna)
            ->where('is_dismissed', false)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    /**
     * Dismiss a single notification (soft delete - won't reappear)
     */
    public function destroy($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $notification = Notifikasi::where('id_notifikasi', $id)
            ->where('id_pengguna', $user->id_pengguna)
            ->first();

        if (!$notification) {
            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
        }

        // Mark as dismissed instead of deleting — prevents re-creation by sync
        $notification->update([
            'is_dismissed' => true,
            'is_read' => true,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Notifikasi berhasil dihapus']);
    }

    /**
     * Dismiss all notifications (soft delete - won't reappear)
     */
    public function destroyAll()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $count = Notifikasi::where('id_pengguna', $user->id_pengguna)
            ->where('is_dismissed', false)
            ->count();

        Notifikasi::where('id_pengguna', $user->id_pengguna)
            ->where('is_dismissed', false)
            ->update([
                'is_dismissed' => true,
                'is_read' => true,
            ]);

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil menghapus {$count} notifikasi"
        ]);
    }

    public function markRead($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $notification = Notifikasi::where('id_notifikasi', $id)
            ->where('id_pengguna', $user->id_pengguna)
            ->first();

        if (!$notification) {
            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json(['status' => 'success', 'message' => 'Notifikasi ditandai telah dibaca']);
    }

    private function syncCustomerNotifications($user)
    {
        $this->upsertVerificationNotification($user);
        $this->upsertTransactionNotifications($user);
        $this->syncBarangNotifications($user);
    }

    private function syncAdminNotifications($user)
    {
        // Stok kritis: di bawah 5 unit
        $criticalGears = Barang::where('jumlah_stok', '<', 5)->get();
        foreach ($criticalGears as $g) {
            $severityLevel = $g->jumlah_stok <= 0 ? 'danger' : ($g->jumlah_stok <= 2 ? 'danger' : 'warning');
            $stockLabel = $g->jumlah_stok <= 0 ? 'HABIS' : "tinggal {$g->jumlah_stok} unit";
            
            $this->upsertNotification($user, 'stock_crit_' . $g->id_barang, [
                'type' => 'stock_warning',
                'title' => $g->jumlah_stok <= 0 ? 'Stok Habis!' : 'Peringatan Stok Kritis',
                'message' => "Stok peralatan '{$g->nama_barang}' {$stockLabel}. Segera lakukan update stok!",
                'severity' => $severityLevel,
                'data' => ['id_barang' => $g->id_barang, 'jumlah_stok' => $g->jumlah_stok],
            ]);
        }

        // Remove stok warnings for items that are no longer critical (>= 5)
        $nonCriticalKeys = Barang::where('jumlah_stok', '>=', 5)->pluck('id_barang')
            ->map(fn($id) => 'stock_crit_' . $id)->toArray();
        
        if (!empty($nonCriticalKeys)) {
            Notifikasi::where('id_pengguna', $user->id_pengguna)
                ->whereIn('unique_key', $nonCriticalKeys)
                ->delete(); // Hard delete — stock recovered, clean up
        }

        $pendingVerifs = Verifikasi::with('pengguna')
            ->where('status_verifikasi', 'pending')
            ->get();

        foreach ($pendingVerifs as $v) {
            $nama = $v->pengguna ? $v->pengguna->nama : 'Pengguna';
            $this->upsertNotification($user, 'admin_verif_pending_' . $v->id_verifikasi, [
                'type' => 'admin_verification',
                'title' => 'Verifikasi KTP Baru',
                'message' => "Ada pengajuan verifikasi KTP baru dari '{$nama}' yang memerlukan persetujuan Anda.",
                'severity' => 'info',
                'data' => ['id_verifikasi' => $v->id_verifikasi],
            ]);
        }

        // Barang pending approval — admin needs to review
        $pendingBarang = Barang::with('pemilik')
            ->where('status_approval', 'pending')
            ->get();

        foreach ($pendingBarang as $b) {
            $namaPemilik = $b->pemilik ? $b->pemilik->nama : 'Perental';
            $this->upsertNotification($user, 'admin_barang_pending_' . $b->id_barang, [
                'type' => 'barang_approval',
                'title' => 'Barang Baru Menunggu Persetujuan',
                'message' => "Barang '{$b->nama_barang}' dari {$namaPemilik} menunggu peninjauan dan persetujuan Anda.",
                'severity' => 'warning',
                'data' => ['id_barang' => $b->id_barang, 'nama_barang' => $b->nama_barang],
            ]);
        }

        // Remove admin pending notifications for barang that are no longer pending
        $nonPendingKeys = Barang::whereIn('status_approval', ['disetujui', 'ditolak'])
            ->pluck('id_barang')
            ->map(fn($id) => 'admin_barang_pending_' . $id)->toArray();

        if (!empty($nonPendingKeys)) {
            Notifikasi::where('id_pengguna', $user->id_pengguna)
                ->whereIn('unique_key', $nonPendingKeys)
                ->where('is_dismissed', false)
                ->delete();
        }
    }

    /**
     * Sync barang (item) notifications for rental owners (customers with rental role).
     * Notifies when their items are approved, rejected, pending re-approval, etc.
     */
    private function syncBarangNotifications($user)
    {
        // Get all barang owned by this user
        $myBarang = Barang::where('id_pemilik', $user->id_pengguna)->get();

        foreach ($myBarang as $b) {
            $uniqueKey = 'barang_status_' . $b->id_barang . '_' . $b->status_approval;

            if ($b->status_approval === 'disetujui') {
                $this->upsertNotification($user, $uniqueKey, [
                    'type' => 'barang_status',
                    'title' => '✅ Barang Disetujui Admin',
                    'message' => "Barang '{$b->nama_barang}' telah disetujui oleh admin dan sekarang tampil di katalog sewa untuk disewa oleh customer.",
                    'severity' => 'success',
                    'data' => ['id_barang' => $b->id_barang, 'status_approval' => 'disetujui'],
                ]);

                // Clean up old pending/rejected notifications for this item
                $this->cleanupOldBarangNotifications($user, $b->id_barang, ['pending', 'ditolak']);

            } elseif ($b->status_approval === 'ditolak') {
                $this->upsertNotification($user, $uniqueKey, [
                    'type' => 'barang_status',
                    'title' => '❌ Barang Ditolak Admin',
                    'message' => "Barang '{$b->nama_barang}' ditolak oleh admin. Silakan perbarui data barang dan ajukan kembali melalui menu Kelola Barang.",
                    'severity' => 'danger',
                    'data' => ['id_barang' => $b->id_barang, 'status_approval' => 'ditolak'],
                ]);

                // Clean up old pending/approved notifications for this item
                $this->cleanupOldBarangNotifications($user, $b->id_barang, ['pending', 'disetujui']);

            } elseif ($b->status_approval === 'pending') {
                $this->upsertNotification($user, $uniqueKey, [
                    'type' => 'barang_status',
                    'title' => '⏳ Barang Menunggu Peninjauan',
                    'message' => "Barang '{$b->nama_barang}' sedang menunggu peninjauan admin. Anda akan diberitahu saat admin menyetujui atau menolaknya.",
                    'severity' => 'warning',
                    'data' => ['id_barang' => $b->id_barang, 'status_approval' => 'pending'],
                ]);

                // Clean up old approved/rejected notifications for this item
                $this->cleanupOldBarangNotifications($user, $b->id_barang, ['disetujui', 'ditolak']);
            }
        }
    }

    /**
     * Clean up outdated barang status notifications when status changes.
     */
    private function cleanupOldBarangNotifications($user, $idBarang, array $oldStatuses)
    {
        $keysToRemove = array_map(
            fn($status) => 'barang_status_' . $idBarang . '_' . $status,
            $oldStatuses
        );

        Notifikasi::where('id_pengguna', $user->id_pengguna)
            ->whereIn('unique_key', $keysToRemove)
            ->delete();
    }

    private function upsertVerificationNotification($user)
    {
        $verifStatus = $user->verification_status;

        if (!$verifStatus) {
            $this->upsertNotification($user, 'verif_none', [
                'type' => 'verification',
                'title' => 'Akun Belum Terverifikasi',
                'message' => 'Akun Anda belum terverifikasi. Silakan unggah foto KTP Anda di menu verifikasi untuk mulai menyewa.',
                'severity' => 'danger',
            ]);
        } elseif ($verifStatus === 'pending') {
            $this->upsertNotification($user, 'verif_pending', [
                'type' => 'verification',
                'title' => 'Verifikasi Diproses',
                'message' => 'Dokumen verifikasi KTP Anda sedang dalam proses peninjauan oleh Admin.',
                'severity' => 'warning',
            ]);
        } elseif ($verifStatus === 'disetujui') {
            $this->upsertNotification($user, 'verif_approved', [
                'type' => 'verification',
                'title' => 'Verifikasi Berhasil',
                'message' => 'Akun Anda telah berhasil diverifikasi. Anda sekarang dapat menyewa alat dengan penuh kemudahan.',
                'severity' => 'success',
            ]);
        } elseif ($verifStatus === 'ditolak') {
            $note = $user->verification_note ? ' Catatan: ' . $user->verification_note : '';
            $this->upsertNotification($user, 'verif_rejected', [
                'type' => 'verification',
                'title' => 'Verifikasi KTP Ditolak',
                'message' => 'Dokumen verifikasi KTP Anda ditolak oleh Admin.' . $note . ' Silakan ajukan ulang.',
                'severity' => 'danger',
            ]);
        }
    }

    private function upsertTransactionNotifications($user)
    {
        $transaksis = Transaksi::where('id_penyewa', $user->id_pengguna)
            ->orderBy('id_transaksi', 'desc')
            ->get();

        foreach ($transaksis as $t) {
            $this->upsertNotification($user, 'sewa_status_' . $t->id_transaksi . '_' . $t->status_sewa, [
                'type' => 'transaction',
                'title' => $this->getTransactionTitle($t),
                'message' => $this->getTransactionMessage($t),
                'severity' => $this->getTransactionSeverity($t),
                'data' => ['id_transaksi' => $t->id_transaksi, 'status_sewa' => $t->status_sewa],
            ]);

            if ($t->status_pembayaran) {
                $this->upsertNotification($user, 'payment_status_' . $t->id_transaksi . '_' . $t->status_pembayaran, [
                    'type' => 'payment',
                    'title' => $this->getPaymentTitle($t),
                    'message' => $this->getPaymentMessage($t),
                    'severity' => $this->getPaymentSeverity($t),
                    'data' => ['id_transaksi' => $t->id_transaksi, 'status_pembayaran' => $t->status_pembayaran],
                ]);
            }
        }
    }

    /**
     * Smart upsert: only creates if not previously dismissed by user.
     * If notification exists and is dismissed, it stays dismissed (won't reappear).
     * If notification exists and is NOT dismissed, update its content dynamically.
     */
    private function upsertNotification($user, $uniqueKey, array $attributes)
    {
        $existing = Notifikasi::where('id_pengguna', $user->id_pengguna)
            ->where('unique_key', $uniqueKey)
            ->first();

        if ($existing) {
            // If user has dismissed this notification, DON'T recreate it
            if ($existing->is_dismissed) {
                return;
            }

            // Update content dynamically (title, message, severity may change)
            $existing->update(array_intersect_key($attributes, array_flip(['title', 'message', 'severity', 'data'])));
        } else {
            // Create new notification
            Notifikasi::create(array_merge($attributes, [
                'id_pengguna' => $user->id_pengguna,
                'unique_key' => $uniqueKey,
            ]));
        }
    }

    private function getTransactionTitle($transaksi)
    {
        return match ($transaksi->status_sewa) {
            'menunggu_pembayaran' => 'Menunggu Pembayaran',
            'dibayar' => 'Pembayaran Berhasil',
            'sedang_disewa' => 'Peralatan Sedang Disewa',
            'selesai' => 'Sewa Selesai',
            default => 'Status Transaksi',
        };
    }

    private function getTransactionMessage($transaksi)
    {
        return match ($transaksi->status_sewa) {
            'menunggu_pembayaran' => "Transaksi #{$transaksi->id_transaksi} dengan total Rp " . number_format($transaksi->total_biaya, 0, ',', '.') . " menunggu pembayaran Anda.",
            'dibayar' => "Pembayaran transaksi #{$transaksi->id_transaksi} telah dikonfirmasi. Peralatan siap diambil.",
            'sedang_disewa' => "Anda sedang menyewa peralatan dari Transaksi #{$transaksi->id_transaksi}. Tanggal kembali: " . date('d-m-Y', strtotime($transaksi->tanggal_selesai)),
            'selesai' => "Transaksi #{$transaksi->id_transaksi} telah selesai dikembalikan secara lengkap. Terima kasih!",
            default => "Status transaksi #{$transaksi->id_transaksi} diperbarui.",
        };
    }

    private function getTransactionSeverity($transaksi)
    {
        return match ($transaksi->status_sewa) {
            'menunggu_pembayaran' => 'warning',
            'dibayar' => 'success',
            'sedang_disewa' => 'info',
            'selesai' => 'success',
            default => 'info',
        };
    }

    private function getPaymentTitle($transaksi)
    {
        return match ($transaksi->status_pembayaran) {
            'pending' => 'Pembayaran Pending',
            'gagal' => 'Pembayaran Gagal',
            'sukses' => 'Pembayaran Berhasil',
            default => 'Status Pembayaran',
        };
    }

    private function getPaymentMessage($transaksi)
    {
        return match ($transaksi->status_pembayaran) {
            'pending' => "Pembayaran transaksi #{$transaksi->id_transaksi} dengan total Rp " . number_format($transaksi->total_biaya, 0, ',', '.') . " sedang menunggu penyelesaian.",
            'gagal' => "Pembayaran transaksi #{$transaksi->id_transaksi} gagal atau dibatalkan.",
            'sukses' => "Pembayaran transaksi #{$transaksi->id_transaksi} telah berhasil dikonfirmasi secara otomatis.",
            default => "Status pembayaran transaksi #{$transaksi->id_transaksi} diperbarui.",
        };
    }

    private function getPaymentSeverity($transaksi)
    {
        return match ($transaksi->status_pembayaran) {
            'pending' => 'warning',
            'gagal' => 'danger',
            'sukses' => 'success',
            default => 'info',
        };
    }
}
