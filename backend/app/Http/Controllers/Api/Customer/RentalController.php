<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Cart;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RentalController extends Controller
{
    // ==================== PUBLIC METHODS (tanpa auth) ====================

    // Get all available barang from DATABASE (untuk public)
    public function getAvailableBarang()
    {
        $barang = Barang::with('pemilik')
            ->withCount('detailTransaksi as total_disewa')
            ->where('status_barang', 'tersedia')
            ->where('status_approval', 'disetujui')
            ->where('jumlah_stok', '>', 0)
            ->orderBy('id_barang', 'desc')
            ->get();

        return response()->json($barang);
    }

    // Get detail barang by ID (untuk public)
    public function getBarangById($id)
    {
        $barang = Barang::with('pemilik')
            ->where('id_barang', $id)
            ->first();

        if (!$barang) {
            return response()->json(['error' => 'Barang tidak ditemukan'], 404);
        }

        return response()->json($barang);
    }

    // ==================== CUSTOMER METHODS (dengan auth) ====================

    // Get barang milik sendiri
    public function myBarang()
    {
        $barang = Barang::where('id_pemilik', Auth::id())
            ->with('kategori')
            ->orderBy('id_barang', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $barang
        ]);
    }

    // Tambah barang untuk disewakan
    public function addBarang(Request $request)
    {
        $request->validate([
            'nama_barang' => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'harga_sewa' => 'required|numeric|min:1000',
            'min_durasi_sewa' => 'nullable|integer|min:1',
            'nominal_deposit' => 'nullable|numeric|min:0',
            'jumlah_stok' => 'required|integer|min:1',
            'id_kategori' => 'required|exists:kategori,id_kategori',
            'foto_barang' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            'metode_penyerahan' => 'nullable|in:pickup,delivery',
            'no_resi_penyerahan' => 'nullable|string|max:100',
        ]);

        $photoPath = null;
        if ($request->hasFile('foto_barang')) {
            $photoPath = $request->file('foto_barang')->store('barang', 'public');
        }

        $metodePenyerahan = $request->metode_penyerahan ?? 'pickup';
        $statusPenyerahan = ($metodePenyerahan === 'delivery' && $request->no_resi_penyerahan) ? 'dikirim' : 'belum_dikirim';

        $barang = Barang::create([
            'id_pemilik' => Auth::id(),
            'id_kategori' => $request->id_kategori,
            'nama_barang' => $request->nama_barang,
            'deskripsi' => $request->deskripsi,
            'harga_sewa' => $request->harga_sewa,
            'min_durasi_sewa' => $request->min_durasi_sewa ?? 1,
            'nominal_deposit' => round($request->harga_sewa * 0.2),
            'jumlah_stok' => $request->jumlah_stok,
            'status_barang' => 'tersedia',
            'status_approval' => 'pending',
            'butuh_verifikasi' => true,
            'foto_barang' => $photoPath,
            'metode_penyerahan' => $metodePenyerahan,
            'no_resi_penyerahan' => $request->no_resi_penyerahan,
            'status_penyerahan' => $statusPenyerahan
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil ditambahkan, menunggu verifikasi admin',
            'data' => $barang
        ], 201);
    }

    // Edit barang
    public function editBarang(Request $request, $id)
    {
        // Allow editing ALL items owned by the authenticated user (including approved ones)
        $barang = Barang::where('id_barang', $id)
            ->where('id_pemilik', Auth::id())
            ->first();

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'nama_barang' => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'harga_sewa' => 'sometimes|numeric|min:1000',
            'min_durasi_sewa' => 'nullable|integer|min:1',
            'nominal_deposit' => 'nullable|numeric|min:0',
            'jumlah_stok' => 'sometimes|integer|min:0',
            'id_kategori' => 'sometimes|exists:kategori,id_kategori',
            'foto_barang' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            'metode_penyerahan' => 'nullable|in:pickup,delivery',
            'no_resi_penyerahan' => 'nullable|string|max:100',
        ]);

        // Track whether non-stock data fields changed on an approved item
        $wasApproved = $barang->status_approval === 'disetujui';
        $dataFieldsChanged = false;

        $updateData = [];

        // Check each data field for changes
        if ($request->has('nama_barang') && $request->nama_barang !== $barang->nama_barang) {
            $updateData['nama_barang'] = $request->nama_barang;
            $dataFieldsChanged = true;
        }
        if ($request->has('deskripsi') && $request->deskripsi !== $barang->deskripsi) {
            $updateData['deskripsi'] = $request->deskripsi;
            $dataFieldsChanged = true;
        }
        if ($request->has('harga_sewa') && floatval($request->harga_sewa) !== floatval($barang->harga_sewa)) {
            $updateData['harga_sewa'] = $request->harga_sewa;
            $updateData['nominal_deposit'] = round($request->harga_sewa * 0.2);
            $dataFieldsChanged = true;
        }
        if ($request->has('id_kategori') && $request->id_kategori != $barang->id_kategori) {
            $updateData['id_kategori'] = $request->id_kategori;
            $dataFieldsChanged = true;
        }
        if ($request->has('metode_penyerahan') && $request->metode_penyerahan !== $barang->metode_penyerahan) {
            $updateData['metode_penyerahan'] = $request->metode_penyerahan;
            $metode = $request->metode_penyerahan;
            $updateData['status_penyerahan'] = ($metode === 'delivery' && $request->no_resi_penyerahan) ? 'dikirim' : 'belum_dikirim';
            $dataFieldsChanged = true;
        }
        if ($request->has('no_resi_penyerahan') && $request->no_resi_penyerahan !== $barang->no_resi_penyerahan) {
            $updateData['no_resi_penyerahan'] = $request->no_resi_penyerahan;
        }

        // Stock changes are always allowed instantly (no re-approval needed)
        if ($request->has('jumlah_stok')) {
            $newStock = intval($request->jumlah_stok);
            $updateData['jumlah_stok'] = $newStock;
            $updateData['status_barang'] = $newStock > 0 ? 'tersedia' : 'habis';
        }

        // Min durasi sewa changes (no re-approval needed)
        if ($request->has('min_durasi_sewa')) {
            $updateData['min_durasi_sewa'] = intval($request->min_durasi_sewa) ?: 1;
        }

        // If data fields changed on an approved item, reset to pending for re-approval
        if ($wasApproved && $dataFieldsChanged) {
            $updateData['status_approval'] = 'pending';
            $updateData['butuh_verifikasi'] = true;
        }

        $barang->update($updateData);

        // Handle photo upload (counts as data change)
        if ($request->hasFile('foto_barang')) {
            if ($barang->foto_barang && \Storage::disk('public')->exists($barang->foto_barang)) {
                \Storage::disk('public')->delete($barang->foto_barang);
            }
            $path = $request->file('foto_barang')->store('barang', 'public');
            $barang->foto_barang = $path;

            // Photo change on approved item also triggers re-approval
            if ($wasApproved) {
                $barang->status_approval = 'pending';
                $barang->butuh_verifikasi = true;
            }
            $barang->save();
        }

        $message = 'Barang berhasil diperbarui';
        if ($wasApproved && ($dataFieldsChanged || $request->hasFile('foto_barang'))) {
            $message = 'Barang berhasil diperbarui. Karena ada perubahan data, barang akan ditinjau ulang oleh admin.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $barang->fresh()->load('kategori')
        ]);
    }

    // Hapus barang
    public function deleteBarang($id)
    {
        $barang = Barang::where('id_barang', $id)
            ->where('id_pemilik', Auth::id())
            ->first();

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        // Cek apakah barang sedang disewa (ada transaksi aktif)
        $activeRentals = DB::table('transaksi')
            ->where('id_barang', $id)
            ->whereIn('status_sewa', ['sedang_disewa', 'dibayar', 'menunggu_pembayaran'])
            ->exists();

        // Juga cek melalui detail_transaksi
        if (!$activeRentals) {
            $activeRentals = DB::table('detail_transaksi')
                ->join('transaksi', 'detail_transaksi.id_transaksi', '=', 'transaksi.id_transaksi')
                ->where('detail_transaksi.id_barang', $id)
                ->whereIn('transaksi.status_sewa', ['sedang_disewa', 'dibayar', 'menunggu_pembayaran'])
                ->exists();
        }

        if ($activeRentals) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak dapat dihapus karena sedang dalam proses penyewaan aktif.'
            ], 400);
        }

        try {
            // Hapus foto dari storage jika ada
            if ($barang->foto_barang && \Storage::disk('public')->exists($barang->foto_barang)) {
                \Storage::disk('public')->delete($barang->foto_barang);
            }

            // Hapus barang (foreign key SET NULL akan otomatis nullify referensi di transaksi & detail_transaksi)
            $barang->delete();

            return response()->json([
                'success' => true,
                'message' => 'Barang berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus barang: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== CART METHODS ====================

    // Get cart
    public function getCart()
    {
        $cart = Cart::where('id_penyewa', Auth::id())
            ->where('status', 'pending')
            ->with('barang.pemilik')
            ->get();

        $total = $cart->sum('total_harga');

        return response()->json([
            'success' => true,
            'data' => $cart,
            'total' => $total
        ]);
    }

    // Add to cart
    public function addToCart(Request $request)
    {
        $request->validate([
            'id_barang' => 'required|exists:barang,id_barang',
            'jumlah' => 'required|integer|min:1',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai'
        ]);

        $barang = Barang::findOrFail($request->id_barang);

        // Cek approval dan stok
        if ($barang->status_approval !== 'disetujui') {
            return response()->json([
                'success' => false,
                'message' => 'Barang belum diverifikasi admin'
            ], 400);
        }

        if ($barang->status_barang !== 'tersedia' || $barang->jumlah_stok < $request->jumlah) {
            return response()->json([
                'success' => false,
                'message' => 'Stok tidak mencukupi'
            ], 400);
        }

        // Cek apakah sudah di cart
        $existingCart = Cart::where('id_penyewa', Auth::id())
            ->where('id_barang', $request->id_barang)
            ->where('status', 'pending')
            ->first();

        if ($existingCart) {
            return response()->json([
                'success' => false,
                'message' => 'Barang sudah ada di keranjang'
            ], 400);
        }

        // Hitung total
        $start = \Carbon\Carbon::parse($request->tanggal_mulai);
        $end = \Carbon\Carbon::parse($request->tanggal_selesai);
        $totalHari = $start->diffInDays($end) + 1;
        $totalHarga = $barang->harga_sewa * $totalHari * $request->jumlah;

        $cart = Cart::create([
            'id_penyewa' => Auth::id(),
            'id_barang' => $request->id_barang,
            'jumlah' => $request->jumlah,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'total_hari' => $totalHari,
            'total_harga' => $totalHarga,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang ditambahkan ke keranjang',
            'data' => $cart->load('barang')
        ], 201);
    }

    // Update cart
    public function updateCart(Request $request, $id)
    {
        $cart = Cart::where('id_cart', $id)
            ->where('id_penyewa', Auth::id())
            ->where('status', 'pending')
            ->first();

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Item tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'jumlah' => 'sometimes|integer|min:1',
            'tanggal_mulai' => 'sometimes|date',
            'tanggal_selesai' => 'sometimes|date'
        ]);

        if ($request->has('jumlah')) {
            $cart->jumlah = $request->jumlah;
        }
        if ($request->has('tanggal_mulai')) {
            $cart->tanggal_mulai = $request->tanggal_mulai;
        }
        if ($request->has('tanggal_selesai')) {
            $cart->tanggal_selesai = $request->tanggal_selesai;
        }

        // Recalculate
        $start = \Carbon\Carbon::parse($cart->tanggal_mulai);
        $end = \Carbon\Carbon::parse($cart->tanggal_selesai);
        $totalHari = $start->diffInDays($end) + 1;
        $cart->total_hari = $totalHari;
        $cart->total_harga = $cart->barang->harga_sewa * $totalHari * $cart->jumlah;

        $cart->save();

        return response()->json([
            'success' => true,
            'message' => 'Keranjang diupdate',
            'data' => $cart->load('barang')
        ]);
    }

    // Remove from cart
    public function removeFromCart($id)
    {
        $cart = Cart::where('id_cart', $id)
            ->where('id_penyewa', Auth::id())
            ->first();

        if (!$cart) {
            return response()->json([
                'success' => false,
                'message' => 'Item tidak ditemukan'
            ], 404);
        }

        $cart->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item dihapus dari keranjang'
        ]);
    }

    // Checkout
    public function checkout()
    {
        $user = Auth::user();
        if (!$user || !$user->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Anda harus melakukan verifikasi KTP dan disetujui oleh admin terlebih dahulu untuk menyewa barang.'
            ], 403);
        }

        $carts = Cart::where('id_penyewa', Auth::id())
            ->where('status', 'pending')
            ->with('barang')
            ->get();

        if ($carts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang kosong'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $totalBiaya = $carts->sum('total_harga');
            $nominalDeposit = $totalBiaya * 0.5;
            $firstCart = $carts->first();

            $transaksi = Transaksi::create([
                'id_penyewa' => Auth::id(),
                'tanggal_mulai' => $firstCart->tanggal_mulai,
                'tanggal_selesai' => $firstCart->tanggal_selesai,
                'total_biaya' => $totalBiaya,
                'nominal_deposit' => $nominalDeposit,
                'status_sewa' => 'menunggu_pembayaran'
            ]);

            foreach ($carts as $cart) {
                DetailTransaksi::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_barang' => $cart->id_barang,
                    'jumlah_pinjam' => $cart->jumlah,
                    'subtotal' => $cart->total_harga
                ]);

                $cart->barang->decrement('jumlah_stok', $cart->jumlah);
                $cart->update(['status' => 'checkout']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Checkout berhasil!',
                'data' => ['id_transaksi' => $transaksi->id_transaksi]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    // My transactions
    public function myTransactions()
    {
        $transaksi = Transaksi::where('id_penyewa', Auth::id())
            ->with(['detailTransaksi.barang', 'pembayaran'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }
}
