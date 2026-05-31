<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\Pengiriman;
use App\Models\Notifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PengirimanController extends Controller
{
    /**
     * Admin: Get all transactions with their shipping records
     */
    public function getAllPengiriman(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        // Tampilkan transaksi yang berstatus sewa: dibayar, sedang_disewa, selesai, dibatalkan
        // yang pembayarannya sukses. Tentu, pickup juga tetap ditampilkan agar admin dapat melihatnya, 
        // tapi delivery memiliki aksi khusus.
        $transactions = Transaksi::with(['penyewa', 'pengiriman', 'detailTransaksi.barang'])
            ->where('status_pembayaran', 'sukses')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Admin: Start shipping process (Kirim Barang)
     */
    public function kirimBarang(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        $transaksi = Transaksi::with('pengiriman')->findOrFail($id);

        if ($transaksi->metode_pengiriman !== 'delivery') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ini bukan metode delivery'
            ], 400);
        }

        $request->validate([
            'kurir' => 'required|string|max:100',
            'no_resi' => 'required|string|max:100',
            'lokasi_terakhir' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // Buat atau update pengiriman
            $pengiriman = Pengiriman::updateOrCreate(
                ['id_transaksi' => $transaksi->id_transaksi],
                [
                    'status_pengiriman' => 'dikirim',
                    'kurir' => $request->kurir,
                    'no_resi' => $request->no_resi,
                    'lokasi_terakhir' => $request->lokasi_terakhir,
                ]
            );

            // Kirim notifikasi pertama kali dikirim
            Notifikasi::create([
                'id_pengguna' => $transaksi->id_penyewa,
                'unique_key' => 'pengiriman_dikirim_' . $transaksi->id_transaksi . '_' . time(),
                'type' => 'shipping',
                'title' => 'Barang Sedang Dikirim 🚚',
                'message' => "Peralatan sewaan Anda ({$transaksi->nama_barang}) telah diserahkan ke kurir {$request->kurir} dengan nomor resi {$request->no_resi}. Posisi saat ini: {$request->lokasi_terakhir}",
                'severity' => 'info',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_pengiriman' => $pengiriman->id_pengiriman,
                    'status_pengiriman' => 'dikirim',
                    'lokasi_terakhir' => $request->lokasi_terakhir,
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status pengiriman diperbarui menjadi DIKIRIM',
                'data' => $pengiriman->load('transaksi')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status pengiriman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Update shipping location & status
     */
    public function updateLokasi(Request $request, $id_pengiriman)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        $pengiriman = Pengiriman::with('transaksi')->findOrFail($id_pengiriman);

        $request->validate([
            'lokasi_terakhir' => 'required|string|max:255',
            'status_pengiriman' => 'required|in:dikirim,sampai,diterima',
        ]);

        DB::beginTransaction();
        try {
            $oldStatus = $pengiriman->status_pengiriman;

            $pengiriman->update([
                'lokasi_terakhir' => $request->lokasi_terakhir,
                'status_pengiriman' => $request->status_pengiriman,
            ]);

            if ($request->status_pengiriman === 'diterima') {
                $pengiriman->transaksi->update(['status_sewa' => 'sedang_disewa']);
            }

            // Kirim notifikasi real-time ke customer ketika lokasi berubah atau status berubah
            $title = 'Pembaruan Lokasi Barang 📍';
            if ($request->status_pengiriman === 'sampai' && $oldStatus !== 'sampai') {
                $title = 'Barang Telah Sampai! 🎉';
                $msg = "Peralatan sewaan Anda ({$pengiriman->transaksi->nama_barang}) telah tiba di tujuan: {$request->lokasi_terakhir}. Silakan lakukan konfirmasi penerimaan barang.";
            } else {
                $msg = "Peralatan sewaan Anda ({$pengiriman->transaksi->nama_barang}) terdeteksi di lokasi baru: {$request->lokasi_terakhir}.";
            }

            Notifikasi::create([
                'id_pengguna' => $pengiriman->transaksi->id_penyewa,
                'unique_key' => 'pengiriman_update_' . $pengiriman->id_transaksi . '_' . time(),
                'type' => 'shipping',
                'title' => $title,
                'message' => $msg,
                'severity' => $request->status_pengiriman === 'sampai' ? 'success' : 'info',
                'data' => [
                    'id_transaksi' => $pengiriman->id_transaksi,
                    'id_pengiriman' => $pengiriman->id_pengiriman,
                    'status_pengiriman' => $request->status_pengiriman,
                    'lokasi_terakhir' => $request->lokasi_terakhir,
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Detail pengiriman berhasil diperbarui',
                'data' => $pengiriman
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui detail pengiriman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Customer: Get tracking details of all active delivery transactions
     */
    public function getTrackingList()
    {
        $transactions = Transaksi::with(['pengiriman', 'pemilik', 'barang', 'detailTransaksi.barang.pemilik'])
            ->where('id_penyewa', Auth::id())
            ->where('metode_pengiriman', 'delivery')
            ->where('status_pembayaran', 'sukses')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Customer: Get tracking details of an active transaction
     */
    public function getTracking($id_transaksi)
    {
        $transaksi = Transaksi::with(['pengiriman', 'pemilik', 'barang'])
            ->where('id_penyewa', Auth::id())
            ->findOrFail($id_transaksi);

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    /**
     * Customer: Confirm that gear is received (Barang Sudah Diterima)
     */
    public function konfirmasiDiterima($id_pengiriman)
    {
        $pengiriman = Pengiriman::with('transaksi')->findOrFail($id_pengiriman);

        if ($pengiriman->transaksi->id_penyewa !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $pengiriman->update([
                'status_pengiriman' => 'diterima',
                'lokasi_terakhir' => 'Diterima oleh Customer (Penyewa)',
            ]);

            // Update status_sewa transaksi menjadi sedang_disewa
            $pengiriman->transaksi->update([
                'status_sewa' => 'sedang_disewa'
            ]);

            // Tambahkan notifikasi penutup
            Notifikasi::create([
                'id_pengguna' => Auth::id(),
                'unique_key' => 'pengiriman_diterima_' . $pengiriman->id_transaksi . '_' . time(),
                'type' => 'shipping',
                'title' => 'Konfirmasi Penerimaan Sukses 👍',
                'message' => "Anda telah mengonfirmasi penerimaan barang ({$pengiriman->transaksi->nama_barang}). Status sewa Anda sekarang aktif (Sedang Disewa). Selamat berpetualang!",
                'severity' => 'success',
                'data' => [
                    'id_transaksi' => $pengiriman->id_transaksi,
                    'status_pengiriman' => 'diterima',
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Barang berhasil dikonfirmasi telah diterima. Status sewa kini aktif.',
                'data' => $pengiriman
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengonfirmasi penerimaan barang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Customer: Request Return (Kembalikan Barang)
     */
    public function customerKembalikanBarang(Request $request, $id)
    {
        $transaksi = Transaksi::where('id_transaksi', $id)
            ->where('id_penyewa', Auth::id())
            ->where('status_sewa', 'sedang_disewa')
            ->firstOrFail();

        $request->validate([
            'metode_kembali' => 'required|in:pickup,delivery',
            'no_resi_kembali' => 'nullable|string|max:100',
        ]);

        $transaksi->update([
            'status_kembali' => 'proses',
            'metode_kembali' => $request->metode_kembali,
            'no_resi_kembali' => $request->no_resi_kembali,
        ]);

        // Kirim notifikasi konfirmasi proses pengembalian dimulai
        Notifikasi::create([
            'id_pengguna' => Auth::id(),
            'unique_key' => 'pengembalian_proses_' . $transaksi->id_transaksi . '_' . time(),
            'type' => 'return',
            'title' => 'Proses Pengembalian Dimulai 🔄',
            'message' => "Proses pengembalian alat '{$transaksi->nama_barang}' via " . ($request->metode_kembali === 'delivery' ? 'Kirim Kurir (Delivery)' : 'Datang Langsung ke Gudang') . " telah diajukan. Menunggu verifikasi penerimaan barang oleh Admin.",
            'severity' => 'warning',
            'data' => [
                'id_transaksi' => $transaksi->id_transaksi,
                'status_kembali' => 'proses',
                'metode_kembali' => $request->metode_kembali,
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pengembalian berhasil dikirim.',
            'data' => $transaksi
        ]);
    }

    /**
     * Admin: Get all items currently rented (Status Barang Disewakan)
     */
    public function adminGetBarangDisewa(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        // Tampilkan semua barang yang sedang_disewa atau proses pengembalian (status_sewa = sedang_disewa)
        // Dan kita tampilkan juga yang berstatus 'selesai' sebagai riwayat jika diperlukan, tapi filter utamanya yang sedang disewa.
        $transactions = Transaksi::with(['penyewa', 'pemilik', 'barang', 'pengembalian'])
            ->whereIn('status_sewa', ['sedang_disewa', 'selesai'])
            ->where('status_pembayaran', 'sukses')
            ->orderBy('status_kembali', 'desc') // Biar yang 'proses' di atas
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Admin: Confirm Return (Alat Dikembalikan & Verifikasi)
     */
    public function adminKonfirmasiKembali(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->status_sewa !== 'sedang_disewa') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ini tidak berstatus sedang disewa'
            ], 400);
        }

        $request->validate([
            'kondisi_barang' => 'required|string|max:100',
            'catatan' => 'nullable|string|max:500',
            'denda_kerusakan' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $tanggalKembali = now();
            $tanggalSelesaiSewa = \Carbon\Carbon::parse($transaksi->tanggal_selesai);
            
            $hariKeterlambatan = 0;
            if ($tanggalKembali->startOfDay()->greaterThan($tanggalSelesaiSewa->startOfDay())) {
                $hariKeterlambatan = $tanggalKembali->startOfDay()->diffInDays($tanggalSelesaiSewa->startOfDay());
            }
            
            $dendaPerHari = 20000;
            $totalDenda = $hariKeterlambatan * $dendaPerHari;
            $dendaKerusakan = $request->denda_kerusakan ?? 0;

            // Hitung sisa deposit setelah dikurangi denda keterlambatan dan denda kerusakan
            $nominalDeposit = $transaksi->nominal_deposit ?? 0;
            $totalPotongan = $totalDenda + $dendaKerusakan;
            $sisaDeposit = max(0, $nominalDeposit - $totalPotongan);

            // Simpan record pengembalian
            $pengembalian = \App\Models\Pengembalian::updateOrCreate(
                ['id_transaksi' => $transaksi->id_transaksi],
                [
                    'tanggal_kembali' => $tanggalKembali->format('Y-m-d'),
                    'jumlah_kembali' => $transaksi->jumlah,
                    'denda_per_hari' => $dendaPerHari,
                    'total_denda' => $totalDenda,
                    'denda_kerusakan' => $dendaKerusakan,
                    'status_pengembalian' => $hariKeterlambatan > 0 ? 'terlambat' : 'tepat_waktu',
                    'kondisi_barang' => $request->kondisi_barang,
                    'catatan' => $request->catatan,
                ]
            );

            // Update transaksi + auto-set deposit status
            $depositStatus = 'none';
            if ($nominalDeposit > 0) {
                $depositStatus = $sisaDeposit > 0 ? 'pending' : 'forfeited';
            }

            $transaksi->update([
                'status_sewa' => 'selesai',
                'status_kembali' => 'diterima',
                'tanggal_kembali_real' => $tanggalKembali->format('Y-m-d'),
                'deposit_status' => $depositStatus,
            ]);

            // Kirim notifikasi penutupan transaksi kepada customer
            $dendaMessage = $totalDenda > 0 ? " Denda keterlambatan sebesar Rp " . number_format($totalDenda, 0, ',', '.') . "." : " Pengembalian tepat waktu tanpa denda keterlambatan.";
            $kerusakanMessage = $dendaKerusakan > 0 ? " Denda kerusakan fisik sebesar Rp " . number_format($dendaKerusakan, 0, ',', '.') . "." : "";
            $depositMessage = $nominalDeposit > 0 ? " Deposit awal: Rp " . number_format($nominalDeposit, 0, ',', '.') . ". Sisa deposit yang dapat dikembalikan: Rp " . number_format($sisaDeposit, 0, ',', '.') . "." : "";

            Notifikasi::create([
                'id_pengguna' => $transaksi->id_penyewa,
                'unique_key' => 'pengembalian_konfirmasi_' . $transaksi->id_transaksi . '_' . time(),
                'type' => 'return',
                'title' => 'Pengembalian Alat Disetujui ✅',
                'message' => "Pengembalian alat sewaan Anda ({$transaksi->nama_barang}) telah diverifikasi oleh Admin. Kondisi barang: {$request->kondisi_barang}." . $dendaMessage . $kerusakanMessage . $depositMessage,
                'severity' => ($totalDenda > 0 || $dendaKerusakan > 0) ? 'danger' : 'success',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'status_sewa' => 'selesai',
                    'status_kembali' => 'diterima',
                    'nominal_deposit' => $nominalDeposit,
                    'total_denda' => $totalDenda,
                    'denda_kerusakan' => $dendaKerusakan,
                    'sisa_deposit' => $sisaDeposit,
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pengembalian barang berhasil dikonfirmasi dan diselesaikan.',
                'data' => $transaksi->load('pengembalian'),
                'sisa_deposit' => $sisaDeposit
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengonfirmasi pengembalian barang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Mark pickup item as collected by customer (Barang Sudah Diambil)
     */
    public function pickupBarangDiambil($id)
    {
        $user = Auth::user();
        if (!$user || $user->peran_pengguna !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak'
            ], 403);
        }

        $transaksi = Transaksi::findOrFail($id);

        if ($transaksi->metode_pengiriman !== 'pickup') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi ini bukan metode pickup'
            ], 400);
        }

        if ($transaksi->status_sewa !== 'dibayar') {
            return response()->json([
                'success' => false,
                'message' => 'Status transaksi tidak valid untuk pengambilan barang. Status saat ini: ' . $transaksi->status_sewa
            ], 400);
        }

        DB::beginTransaction();
        try {
            $transaksi->update([
                'status_sewa' => 'sedang_disewa'
            ]);

            // Kirim notifikasi ke customer
            Notifikasi::create([
                'id_pengguna' => $transaksi->id_penyewa,
                'unique_key' => 'pickup_diambil_' . $transaksi->id_transaksi . '_' . time(),
                'type' => 'shipping',
                'title' => 'Barang Berhasil Diambil 📦',
                'message' => "Peralatan sewaan Anda ({$transaksi->nama_barang}) telah berhasil diambil dari gudang. Status sewa Anda sekarang aktif (Sedang Disewa). Selamat berpetualang!",
                'severity' => 'success',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'status_sewa' => 'sedang_disewa',
                    'metode_pengiriman' => 'pickup',
                ]
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Barang berhasil ditandai sebagai diambil. Status sewa kini aktif.',
                'data' => $transaksi
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status pengambilan barang: ' . $e->getMessage()
            ], 500);
        }
    }
}
