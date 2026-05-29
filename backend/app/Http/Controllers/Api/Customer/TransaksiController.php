<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\DetailTransaksi;
use App\Models\Transaksi;
use App\Models\Pengembalian;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TransaksiController extends Controller
{
    protected $midtrans;

    public function __construct(MidtransService $midtrans)
    {
        $this->midtrans = $midtrans;
    }

    /**
     * Multi-item checkout — supports 1 or more items in a single transaction.
     * Creates 1 Transaksi (master) + N DetailTransaksi (items) + 1 Midtrans snap token.
     */
    public function checkout(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->is_verified) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda harus melakukan verifikasi KTP dan disetujui oleh admin terlebih dahulu untuk menyewa barang.'
            ], 403);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id_barang' => 'required|exists:barang,id_barang',
            'items.*.jumlah' => 'required|integer|min:1',
            'items.*.tanggal_mulai' => 'required|date',
            'items.*.tanggal_selesai' => 'required|date|after:items.*.tanggal_mulai',
            'metode_pengiriman' => 'required|in:pickup,delivery',
            'alamat_pengiriman' => 'nullable|string',
            'biaya_pengiriman' => 'nullable|numeric',
        ]);

        DB::beginTransaction();

        try {
            $items = $request->items;
            $biayaPengiriman = $request->biaya_pengiriman ?? 0;

            // Calculate totals for all items
            $totalSewa = 0;
            $totalDeposit = 0;
            $midtransItems = [];
            $detailItems = [];

            // Use the first item's dates for the master transaction
            $firstItem = $items[0];
            $masterStart = \Carbon\Carbon::parse($firstItem['tanggal_mulai']);
            $masterEnd = \Carbon\Carbon::parse($firstItem['tanggal_selesai']);
            $masterTotalHari = $masterStart->diffInDays($masterEnd) + 1;

            foreach ($items as $item) {
                $barang = Barang::with('pemilik')->findOrFail($item['id_barang']);

                // Check stock
                if ($barang->jumlah_stok < $item['jumlah']) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => "Stok '{$barang->nama_barang}' tidak mencukupi (tersisa {$barang->jumlah_stok} unit)"
                    ], 400);
                }

                $start = \Carbon\Carbon::parse($item['tanggal_mulai']);
                $end = \Carbon\Carbon::parse($item['tanggal_selesai']);
                $totalHari = $start->diffInDays($end) + 1;

                // Check minimum rental duration
                $minDurasi = $barang->min_durasi_sewa ?? 1;
                if ($totalHari < $minDurasi) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'error',
                        'message' => "Durasi sewa '{$barang->nama_barang}' minimal {$minDurasi} hari (Anda memilih {$totalHari} hari)"
                    ], 400);
                }

                $subtotalSewa = $barang->harga_sewa * $totalHari * $item['jumlah'];
                $itemDeposit = ($barang->nominal_deposit ?? 0) * $item['jumlah'];

                $totalSewa += $subtotalSewa;
                $totalDeposit += $itemDeposit;

                $detailItems[] = [
                    'id_barang' => $barang->id_barang,
                    'nama_barang' => $barang->nama_barang,
                    'harga_per_hari' => $barang->harga_sewa,
                    'jumlah_pinjam' => $item['jumlah'],
                    'subtotal' => $subtotalSewa,
                    'nominal_deposit' => $itemDeposit,
                    'id_pemilik' => $barang->id_pemilik,
                    'total_hari' => $totalHari,
                ];

                // Midtrans item
                $midtransItems[] = [
                    'id' => (string) $barang->id_barang,
                    'price' => (int) $barang->harga_sewa,
                    'quantity' => $totalHari * $item['jumlah'],
                    'name' => mb_substr($barang->nama_barang, 0, 40) . ' (' . $totalHari . 'hr x' . $item['jumlah'] . ')',
                ];

                // Midtrans deposit item per barang
                if ($itemDeposit > 0) {
                    $midtransItems[] = [
                        'id' => 'DEP-' . $barang->id_barang,
                        'price' => (int) $barang->nominal_deposit,  // ✅ Harga per unit deposit
                        'quantity' => $item['jumlah'],              // ✅ Dikalikan jumlah unit
                        'name' => 'Deposit: ' . mb_substr($barang->nama_barang, 0, 30),
                    ];
                }
            }

            // Fee admin (20%) dari total sewa
            $feeAdmin = round($totalSewa * 0.2);
            $pendapatanPemilik = $totalSewa - $feeAdmin;

            // Add shipping cost as Midtrans item if applicable
            if ($biayaPengiriman > 0) {
                $midtransItems[] = [
                    'id' => 'SHIPPING',
                    'price' => (int) $biayaPengiriman,
                    'quantity' => 1,
                    'name' => 'Biaya Pengiriman',
                ];
            }

            // Calculate gross_amount DIRECTLY from Midtrans items to guarantee exact match
            $grossAmount = 0;
            foreach ($midtransItems as $mi) {
                $grossAmount += $mi['price'] * $mi['quantity'];
            }

            // Total biaya for DB record
            $totalBiaya = $grossAmount;

            // Build order ID
            $orderId = 'TRX-' . time() . '-' . Auth::id();

            // Use first item as the primary reference (backward compat)
            $firstBarang = Barang::findOrFail($items[0]['id_barang']);

            // Create master transaction
            $transaksi = Transaksi::create([
                'id_penyewa' => Auth::id(),
                'id_pemilik' => $firstBarang->id_pemilik,
                'id_barang' => $firstBarang->id_barang,
                'nama_barang' => count($items) > 1
                    ? $firstBarang->nama_barang . ' +' . (count($items) - 1) . ' lainnya'
                    : $firstBarang->nama_barang,
                'jumlah' => array_sum(array_column($items, 'jumlah')),
                'harga_per_hari' => $firstBarang->harga_sewa,
                'tanggal_mulai' => $firstItem['tanggal_mulai'],
                'tanggal_selesai' => $firstItem['tanggal_selesai'],
                'total_hari' => $masterTotalHari,
                'total_biaya' => $totalBiaya,
                'nominal_deposit' => $totalDeposit,
                'fee_admin' => $feeAdmin,
                'pendapatan_pemilik' => $pendapatanPemilik,
                'metode_pengiriman' => $request->metode_pengiriman,
                'alamat_pengiriman' => $request->alamat_pengiriman,
                'biaya_pengiriman' => $biayaPengiriman,
                'status_pembayaran' => 'pending',
                'status_sewa' => 'menunggu_pembayaran',
                'midtrans_order_id' => $orderId,
            ]);

            // Create detail transaksi for each item
            foreach ($detailItems as $detail) {
                DetailTransaksi::create([
                    'id_transaksi' => $transaksi->id_transaksi,
                    'id_barang' => $detail['id_barang'],
                    'nama_barang' => $detail['nama_barang'],
                    'harga_per_hari' => $detail['harga_per_hari'],
                    'jumlah_pinjam' => $detail['jumlah_pinjam'],
                    'subtotal' => $detail['subtotal'],
                    'nominal_deposit' => $detail['nominal_deposit'],
                    'id_pemilik' => $detail['id_pemilik'],
                ]);
            }

            // Customer details for Midtrans
            $customerDetails = [
                'first_name' => $user->nama,
                'email' => $user->email,
                'phone' => $user->no_telp ?? '',
            ];

            // Create Midtrans transaction — grossAmount is guaranteed to match items sum
            $result = $this->midtrans->createTransaction(
                $orderId,
                $grossAmount,
                $midtransItems,
                $customerDetails,
                [
                    'finish' => 'http://localhost:5173/customer/transactions',
                    'error' => 'http://localhost:5173/customer/transactions',
                    'pending' => 'http://localhost:5173/customer/transactions',
                ]
            );
            if (isset($result['error'])) {
                DB::rollBack();
                return response()->json(['error' => $result['error']], 500);
            }

            $transaksi->update(['snap_token' => $result['snap_token']]);

            DB::commit();

            return response()->json([
                'snap_token' => $result['snap_token'],
                'transaction_id' => $transaksi->id_transaksi,
                'order_id' => $orderId,
                'total_items' => count($items),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get transactions where current user is the renter (penyewa)
     */
    public function getTransaksiSebagaiPenyewa()
    {
        $transaksi = Transaksi::with(['pemilik', 'barang', 'pengembalian', 'detailTransaksi.barang.pemilik'])
            ->where('id_penyewa', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    /**
     * Get transactions where current user is the owner (pemilik).
     * For multi-item transactions, show transactions that contain items owned by the current user.
     */
    public function getTransaksiSebagaiPemilik()
    {
        // Find all transaksi IDs that have detail items owned by this user
        $transaksiIdsFromDetail = DetailTransaksi::where('id_pemilik', Auth::id())
            ->pluck('id_transaksi')
            ->unique()
            ->toArray();

        // Also find directly from transaksi table (backward compatibility)
        $transaksiIdsDirect = Transaksi::where('id_pemilik', Auth::id())
            ->pluck('id_transaksi')
            ->toArray();

        $allIds = array_unique(array_merge($transaksiIdsFromDetail, $transaksiIdsDirect));

        $transaksi = Transaksi::with(['penyewa', 'barang', 'pengembalian', 'detailTransaksi.barang.pemilik'])
            ->whereIn('id_transaksi', $allIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_sewa' => 'required|in:menunggu_pembayaran,dibayar,sedang_disewa,selesai,dibatalkan',
        ]);

        $transaksi = Transaksi::where('id_transaksi', $id)
            ->where(function ($q) {
                $q->where('id_penyewa', Auth::id())
                    ->orWhere('id_pemilik', Auth::id());
            })
            ->first();

        if (!$transaksi) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        $transaksi->update(['status_sewa' => $request->status_sewa]);

        if ($request->status_sewa === 'selesai') {
            $tanggalKembali = now();
            $tanggalSelesaiSewa = \Carbon\Carbon::parse($transaksi->tanggal_selesai);

            $hariKeterlambatan = 0;
            if ($tanggalKembali->startOfDay()->greaterThan($tanggalSelesaiSewa->startOfDay())) {
                $hariKeterlambatan = $tanggalKembali->startOfDay()->diffInDays($tanggalSelesaiSewa->startOfDay());
            }

            $dendaPerHari = 20000;
            $totalDenda = $hariKeterlambatan * $dendaPerHari;

            Pengembalian::updateOrCreate(
                ['id_transaksi' => $transaksi->id_transaksi],
                [
                    'tanggal_kembali' => $tanggalKembali->format('Y-m-d'),
                    'jumlah_kembali' => $transaksi->jumlah,
                    'denda_per_hari' => $dendaPerHari,
                    'total_denda' => $totalDenda,
                    'status_pengembalian' => $hariKeterlambatan > 0 ? 'terlambat' : 'tepat_waktu',
                    'kondisi_barang' => 'baik',
                ]
            );

            $transaksi->update(['tanggal_kembali_real' => $tanggalKembali->format('Y-m-d')]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status updated',
            'data' => $transaksi->load('pengembalian')
        ]);
    }

    /**
     * Handle Midtrans payment notification.
     * For multi-item transactions, decrement stock for ALL items in detail_transaksi.
     */
    public function handleNotification(Request $request)
    {
        $result = $this->midtrans->handleNotification();

        $transaksi = Transaksi::where('midtrans_order_id', $result['order_id'])->first();

        if (!$transaksi) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }

        if ($result['status'] === 'capture' || $result['status'] === 'settlement') {
            $transaksi->update([
                'status_pembayaran' => 'sukses',
                'status_sewa' => 'dibayar',
            ]);

            // Decrement stock for ALL items in this transaction
            $details = DetailTransaksi::where('id_transaksi', $transaksi->id_transaksi)->get();

            if ($details->isNotEmpty()) {
                // Multi-item: use detail_transaksi
                foreach ($details as $detail) {
                    $barang = Barang::find($detail->id_barang);
                    if ($barang) {
                        $barang->decrement('jumlah_stok', $detail->jumlah_pinjam);
                    }
                }
            } else {
                // Backward compatibility: single-item from transaksi table
                $barang = Barang::find($transaksi->id_barang);
                if ($barang) {
                    $barang->decrement('jumlah_stok', $transaksi->jumlah);
                }
            }
        } elseif ($result['status'] === 'deny' || $result['status'] === 'expire' || $result['status'] === 'cancel') {
            $transaksi->update([
                'status_pembayaran' => 'gagal',
                'status_sewa' => 'dibatalkan',
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
