<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\PengajuanPengembalian;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Notifikasi;
use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PengajuanPengembalianController extends Controller
{
    /**
     * Customer: Submit pengajuan pengembalian
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'id_transaksi' => 'required|exists:transaksi,id_transaksi',
            'alasan' => 'required|string|min:10|max:1000',
            'foto_bukti' => 'required|array|min:1|max:5',
            'foto_bukti.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'metode_pengembalian' => 'required|in:pickup,delivery',
            'alamat_pengembalian' => 'nullable|required_if:metode_pengembalian,delivery|string|max:500',
            'nama_bank' => 'required|string|max:100',
            'no_rekening' => 'required|string|max:50',
            'atas_nama_rekening' => 'required|string|max:150',
        ]);

        // Verify the transaction belongs to this customer
        $transaksi = Transaksi::where('id_transaksi', $request->id_transaksi)
            ->where('id_penyewa', $user->id_pengguna)
            ->first();

        if (!$transaksi) {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
        }

        // Check if there's already a pending request for this transaction
        $existing = PengajuanPengembalian::where('id_transaksi', $transaksi->id_transaksi)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sudah ada pengajuan pengembalian yang sedang diproses untuk transaksi ini'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Upload photos
            $fotoPaths = [];
            if ($request->hasFile('foto_bukti')) {
                foreach ($request->file('foto_bukti') as $foto) {
                    $path = $foto->store('pengembalian', 'public');
                    $fotoPaths[] = $path;
                }
            }

            $pengajuan = PengajuanPengembalian::create([
                'id_transaksi' => $transaksi->id_transaksi,
                'id_customer' => $user->id_pengguna,
                'alasan' => $request->alasan,
                'foto_bukti' => $fotoPaths,
                'metode_pengembalian' => $request->metode_pengembalian,
                'alamat_pengembalian' => $request->metode_pengembalian === 'delivery' ? $request->alamat_pengembalian : null,
                'nama_bank' => $request->nama_bank,
                'no_rekening' => $request->no_rekening,
                'atas_nama_rekening' => $request->atas_nama_rekening,
                'status' => 'pending',
            ]);

            // Notify all admins
            $admins = Pengguna::where('peran_pengguna', 'admin')->get();
            $metodeLabel = $request->metode_pengembalian === 'delivery' ? 'Delivery (ongkir ditanggung admin)' : 'Pickup (antar sendiri)';
            foreach ($admins as $admin) {
                Notifikasi::create([
                    'id_pengguna' => $admin->id_pengguna,
                    'unique_key' => 'pengajuan_retur_' . $pengajuan->id_pengajuan . '_' . time(),
                    'type' => 'return_request',
                    'title' => 'Pengajuan Pengembalian Baru 📦',
                    'message' => "Customer {$user->nama} mengajukan pengembalian barang \"{$transaksi->nama_barang}\" via {$metodeLabel}. Alasan: " . substr($request->alasan, 0, 100),
                    'severity' => 'warning',
                    'data' => [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_transaksi' => $transaksi->id_transaksi,
                    ]
                ]);
            }

            // Notify perental (item owner) about the return request
            if ($transaksi->id_pemilik) {
                Notifikasi::create([
                    'id_pengguna' => $transaksi->id_pemilik,
                    'unique_key' => 'retur_owner_request_' . $pengajuan->id_pengajuan . '_' . time(),
                    'type' => 'return_request',
                    'title' => 'Customer Mengajukan Pengembalian Barang 📦',
                    'message' => "Customer {$user->nama} mengajukan pengembalian barang \"{$transaksi->nama_barang}\" milik Anda via {$metodeLabel}. Alasan: " . substr($request->alasan, 0, 100) . ". Menunggu keputusan admin.",
                    'severity' => 'warning',
                    'data' => [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_transaksi' => $transaksi->id_transaksi,
                    ]
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan pengembalian berhasil dikirim. Menunggu review dari admin.',
                'data' => $pengajuan->load(['transaksi', 'customer'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim pengajuan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Customer: Get my return requests
     */
    public function myRequests()
    {
        $user = Auth::user();

        $requests = PengajuanPengembalian::where('id_customer', $user->id_pengguna)
            ->with(['transaksi.barang', 'transaksi.pemilik'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    /**
     * Perental: Get return requests for items I own
     */
    public function getByPemilik()
    {
        $userId = Auth::id();

        // Find transaksi IDs where this user is the owner
        $transaksiIdsFromDetail = DetailTransaksi::where('id_pemilik', $userId)
            ->pluck('id_transaksi')
            ->unique()
            ->toArray();

        $transaksiIdsDirect = Transaksi::where('id_pemilik', $userId)
            ->pluck('id_transaksi')
            ->toArray();

        $allIds = array_unique(array_merge($transaksiIdsFromDetail, $transaksiIdsDirect));

        $requests = PengajuanPengembalian::whereIn('id_transaksi', $allIds)
            ->with(['transaksi.barang', 'transaksi.penyewa', 'customer'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    /**
     * Admin: Get all return requests
     */
    public function index()
    {
        $requests = PengajuanPengembalian::with(['transaksi.barang', 'transaksi.pemilik', 'customer'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    /**
     * Admin: Approve return request + calculate dynamic refund
     * 
     * Refund calculation:
     * - sisa_hari_sewa = remaining unused rental days
     * - refund_sewa = proportional refund based on remaining days
     * - refund_deposit = full deposit refund
     * - potongan_admin_fee = proportional admin fee deduction
     * - jumlah_refund = refund_sewa + refund_deposit - potongan_admin_fee
     * - biaya_ongkir_pengembalian = shipping cost for delivery return (borne by admin, NOT deducted from refund)
     */
    public function approve(Request $request, $id)
    {
        $pengajuan = PengajuanPengembalian::with('transaksi')->findOrFail($id);

        if ($pengajuan->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan sudah diproses sebelumnya'
            ], 400);
        }

        $request->validate([
            'biaya_ongkir_pengembalian' => 'nullable|numeric|min:0',
            'catatan_admin' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $transaksi = $pengajuan->transaksi;

            // === DYNAMIC REFUND CALCULATION ===
            $totalBiayaSewa = $transaksi->total_biaya ?? 0;
            $totalHariSewa = $transaksi->total_hari ?? 1;
            $nominalDeposit = $transaksi->nominal_deposit ?? 0;
            $feeAdmin = $transaksi->fee_admin ?? 0;
            $biayaPengiriman = $transaksi->biaya_pengiriman ?? 0;

            // Calculate remaining days
            $tanggalMulai = Carbon::parse($transaksi->tanggal_mulai);
            $tanggalSelesai = Carbon::parse($transaksi->tanggal_selesai);
            $today = Carbon::today();

            // If rental hasn't started yet, full refund on rental portion
            if ($today->lt($tanggalMulai)) {
                $hariTerpakai = 0;
            } else {
                // Days used = from start to today (inclusive), capped at total days
                $hariTerpakai = min($tanggalMulai->diffInDays($today) + 1, $totalHariSewa);
            }
            $sisaHariSewa = max($totalHariSewa - $hariTerpakai, 0);

            // Calculate the pure rental cost (total_biaya - deposit - biaya_pengiriman)
            $pureRentalCost = $totalBiayaSewa - $nominalDeposit - $biayaPengiriman;
            if ($pureRentalCost < 0) $pureRentalCost = 0;

            // Proportional refund on rental portion
            $refundSewa = $totalHariSewa > 0
                ? round($pureRentalCost * ($sisaHariSewa / $totalHariSewa))
                : 0;

            // Full deposit refund
            $refundDeposit = $nominalDeposit;

            // Proportional admin fee deduction
            $potonganAdminFee = $totalHariSewa > 0
                ? round($feeAdmin * ($sisaHariSewa / $totalHariSewa))
                : 0;

            // Total refund to customer = rental refund + deposit - admin fee deduction
            $jumlahRefund = $refundSewa + $refundDeposit - $potonganAdminFee;
            if ($jumlahRefund < 0) $jumlahRefund = 0;

            // Shipping cost for delivery return (borne by admin, NOT deducted)
            $biayaOngkirPengembalian = 0;
            if ($pengajuan->metode_pengembalian === 'delivery') {
                $biayaOngkirPengembalian = $request->biaya_ongkir_pengembalian ?? 0;
            }

            $pengajuan->update([
                'status' => 'disetujui',
                'catatan_admin' => $request->catatan_admin ?? 'Pengajuan disetujui oleh admin',
                'sisa_hari_sewa' => $sisaHariSewa,
                'refund_sewa' => $refundSewa,
                'refund_deposit' => $refundDeposit,
                'potongan_admin_fee' => $potonganAdminFee,
                'biaya_ongkir_pengembalian' => $biayaOngkirPengembalian,
                'jumlah_refund' => $jumlahRefund,
                'status_refund' => 'proses_refund',
            ]);

            // Update transaction status to 'refund'
            $transaksi->update([
                'status_sewa' => 'refund',
            ]);

            // Format currency for notifications
            $refundFormatted = 'Rp ' . number_format($jumlahRefund, 0, ',', '.');
            $metodeLabel = $pengajuan->metode_pengembalian === 'delivery' ? 'delivery' : 'pickup';

            // Notify customer with dynamic refund breakdown
            $breakdownMsg = "Rincian refund: Sewa Rp " . number_format($refundSewa, 0, ',', '.') 
                . " + Deposit Rp " . number_format($refundDeposit, 0, ',', '.')
                . " - Fee Admin Rp " . number_format($potonganAdminFee, 0, ',', '.')
                . " = Total {$refundFormatted}.";

            if ($pengajuan->metode_pengembalian === 'delivery' && $biayaOngkirPengembalian > 0) {
                $breakdownMsg .= " Ongkir pengembalian Rp " . number_format($biayaOngkirPengembalian, 0, ',', '.') . " ditanggung admin.";
            }

            Notifikasi::create([
                'id_pengguna' => $pengajuan->id_customer,
                'unique_key' => 'retur_approved_' . $pengajuan->id_pengajuan . '_' . time(),
                'type' => 'return_approved',
                'title' => 'Pengembalian Disetujui + Refund 💰',
                'message' => "Pengajuan pengembalian barang \"{$transaksi->nama_barang}\" disetujui! {$breakdownMsg}",
                'severity' => 'success',
                'data' => [
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_transaksi' => $pengajuan->id_transaksi,
                    'jumlah_refund' => $jumlahRefund,
                    'refund_sewa' => $refundSewa,
                    'refund_deposit' => $refundDeposit,
                    'potongan_admin_fee' => $potonganAdminFee,
                ]
            ]);

            // Notify perental (owner) about the refund on their item
            if ($transaksi->id_pemilik) {
                Notifikasi::create([
                    'id_pengguna' => $transaksi->id_pemilik,
                    'unique_key' => 'retur_owner_approved_' . $pengajuan->id_pengajuan . '_' . time(),
                    'type' => 'return_approved',
                    'title' => 'Pengembalian Barang Disetujui oleh Admin 📦',
                    'message' => "Pengajuan pengembalian barang \"{$transaksi->nama_barang}\" telah disetujui admin. Refund {$refundFormatted} akan diproses (metode pengembalian: {$metodeLabel}).",
                    'severity' => 'warning',
                    'data' => [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_transaksi' => $pengajuan->id_transaksi,
                        'jumlah_refund' => $jumlahRefund,
                    ]
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan disetujui. Refund ' . $refundFormatted . ' sedang diproses.',
                'data' => $pengajuan->fresh()->load(['transaksi', 'customer'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Confirm refund has been sent (upload bukti transfer)
     */
    public function confirmRefund(Request $request, $id)
    {
        $request->validate([
            'metode_refund' => 'required|string|in:transfer_bank,ewallet,tunai',
            'bukti_refund' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $pengajuan = PengajuanPengembalian::with('transaksi')->findOrFail($id);

        if ($pengajuan->status !== 'disetujui' || $pengajuan->status_refund === 'sudah_refund') {
            return response()->json([
                'status' => 'error',
                'message' => 'Refund tidak dapat diproses untuk pengajuan ini'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $buktiPath = null;
            if ($request->hasFile('bukti_refund')) {
                $buktiPath = $request->file('bukti_refund')->store('refund_bukti', 'public');
            }

            $pengajuan->update([
                'status_refund' => 'sudah_refund',
                'metode_refund' => $request->metode_refund,
                'bukti_refund' => $buktiPath,
                'tanggal_refund' => now(),
            ]);

            // Notify customer that refund is done
            Notifikasi::create([
                'id_pengguna' => $pengajuan->id_customer,
                'unique_key' => 'refund_completed_' . $pengajuan->id_pengajuan . '_' . time(),
                'type' => 'refund_completed',
                'title' => 'Refund Selesai! 🎉',
                'message' => "Refund sebesar Rp " . number_format($pengajuan->jumlah_refund, 0, ',', '.') . " telah dikirim melalui {$request->metode_refund}. Silakan cek rekening/saldo Anda.",
                'severity' => 'success',
                'data' => [
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_transaksi' => $pengajuan->id_transaksi,
                    'jumlah_refund' => $pengajuan->jumlah_refund,
                    'metode_refund' => $request->metode_refund,
                ]
            ]);

            // Notify perental that refund is confirmed
            $transaksi = $pengajuan->transaksi;
            if ($transaksi && $transaksi->id_pemilik) {
                Notifikasi::create([
                    'id_pengguna' => $transaksi->id_pemilik,
                    'unique_key' => 'refund_owner_completed_' . $pengajuan->id_pengajuan . '_' . time(),
                    'type' => 'refund_completed',
                    'title' => 'Refund Telah Dikonfirmasi 💸',
                    'message' => "Admin telah mengirim refund Rp " . number_format($pengajuan->jumlah_refund, 0, ',', '.') . " untuk barang \"{$transaksi->nama_barang}\". Pendapatan Anda telah disesuaikan.",
                    'severity' => 'info',
                    'data' => [
                        'id_pengajuan' => $pengajuan->id_pengajuan,
                        'id_transaksi' => $pengajuan->id_transaksi,
                        'jumlah_refund' => $pengajuan->jumlah_refund,
                    ]
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Refund berhasil dikonfirmasi',
                'data' => $pengajuan->fresh()->load(['transaksi', 'customer'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengkonfirmasi refund: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Reject return request
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'catatan_admin' => 'required|string|min:5',
        ]);

        $pengajuan = PengajuanPengembalian::with('transaksi')->findOrFail($id);

        if ($pengajuan->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengajuan sudah diproses sebelumnya'
            ], 400);
        }

        $pengajuan->update([
            'status' => 'ditolak',
            'catatan_admin' => $request->catatan_admin,
        ]);

        $transaksi = $pengajuan->transaksi;

        // Notify customer
        Notifikasi::create([
            'id_pengguna' => $pengajuan->id_customer,
            'unique_key' => 'retur_rejected_' . $pengajuan->id_pengajuan . '_' . time(),
            'type' => 'return_rejected',
            'title' => 'Pengajuan Pengembalian Ditolak ❌',
            'message' => "Pengajuan pengembalian barang \"{$transaksi->nama_barang}\" Anda ditolak oleh admin. Alasan: {$request->catatan_admin}",
            'severity' => 'error',
            'data' => [
                'id_pengajuan' => $pengajuan->id_pengajuan,
                'id_transaksi' => $pengajuan->id_transaksi,
            ]
        ]);

        // Notify perental (item owner) that return is rejected
        if ($transaksi && $transaksi->id_pemilik) {
            Notifikasi::create([
                'id_pengguna' => $transaksi->id_pemilik,
                'unique_key' => 'retur_owner_rejected_' . $pengajuan->id_pengajuan . '_' . time(),
                'type' => 'return_rejected',
                'title' => 'Pengajuan Pengembalian Ditolak oleh Admin ✅',
                'message' => "Pengajuan pengembalian barang \"{$transaksi->nama_barang}\" oleh customer telah ditolak admin. Pendapatan Anda tidak terpengaruh.",
                'severity' => 'info',
                'data' => [
                    'id_pengajuan' => $pengajuan->id_pengajuan,
                    'id_transaksi' => $pengajuan->id_transaksi,
                ]
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan pengembalian ditolak',
            'data' => $pengajuan->load(['transaksi', 'customer'])
        ]);
    }
}
