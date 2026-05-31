<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Models\Notifikasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DepositRefundController extends Controller
{
    /**
     * GET /api/admin/deposit-refund
     * List semua transaksi selesai yang memiliki deposit > 0
     */
    public function index()
    {
        $transactions = Transaksi::with(['penyewa', 'pemilik', 'pengembalian'])
            ->where('status_sewa', 'selesai')
            ->where('nominal_deposit', '>', 0)
            ->orderByRaw("FIELD(deposit_status, 'pending', 'none', 'partial_refund', 'refunded', 'forfeited')")
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($trx) {
                $dendaTerlambat = $trx->pengembalian->total_denda ?? 0;
                $dendaKerusakan = $trx->pengembalian->denda_kerusakan ?? 0;
                $totalPotongan = $dendaTerlambat + $dendaKerusakan;
                $sisaDeposit = max(0, $trx->nominal_deposit - $totalPotongan);

                $trx->calculated_sisa_deposit = $sisaDeposit;
                $trx->calculated_total_potongan = $totalPotongan;
                $trx->calculated_denda_terlambat = $dendaTerlambat;
                $trx->calculated_denda_kerusakan = $dendaKerusakan;

                return $trx;
            });

        // Stats
        $stats = [
            'total' => $transactions->count(),
            'pending' => $transactions->where('deposit_status', 'pending')->count(),
            'refunded' => $transactions->whereIn('deposit_status', ['refunded', 'partial_refund'])->count(),
            'forfeited' => $transactions->where('deposit_status', 'forfeited')->count(),
            'total_pending_amount' => $transactions->where('deposit_status', 'pending')->sum('calculated_sisa_deposit'),
            'total_refunded_amount' => $transactions->whereIn('deposit_status', ['refunded', 'partial_refund'])->sum('deposit_refund_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'stats' => $stats,
        ]);
    }

    /**
     * POST /api/admin/deposit-refund/{id}/process
     * Admin proses refund deposit
     */
    public function process(Request $request, $id)
    {
        $user = Auth::user();

        $request->validate([
            'refund_amount' => 'required|numeric|min:0',
            'refund_method' => 'required|string|max:100',
            'refund_note' => 'nullable|string|max:1000',
            'refund_proof' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $transaksi = Transaksi::with('pengembalian')->findOrFail($id);

        if ($transaksi->status_sewa !== 'selesai') {
            return response()->json(['message' => 'Transaksi belum selesai'], 400);
        }

        if ($transaksi->nominal_deposit <= 0) {
            return response()->json(['message' => 'Transaksi ini tidak memiliki deposit'], 400);
        }

        if (in_array($transaksi->deposit_status, ['refunded', 'forfeited'])) {
            return response()->json(['message' => 'Deposit sudah diproses sebelumnya'], 409);
        }

        // Hitung sisa deposit
        $dendaTerlambat = $transaksi->pengembalian->total_denda ?? 0;
        $dendaKerusakan = $transaksi->pengembalian->denda_kerusakan ?? 0;
        $totalPotongan = $dendaTerlambat + $dendaKerusakan;
        $sisaDeposit = max(0, $transaksi->nominal_deposit - $totalPotongan);

        $refundAmount = $request->refund_amount;

        if ($refundAmount > $sisaDeposit) {
            return response()->json([
                'message' => 'Jumlah refund tidak boleh melebihi sisa deposit (Rp ' . number_format($sisaDeposit, 0, ',', '.') . ')',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $depositStatus = $refundAmount >= $sisaDeposit ? 'refunded' : 'partial_refund';

            // Handle bukti transfer
            $proofPath = null;
            if ($request->hasFile('refund_proof')) {
                $proofPath = $request->file('refund_proof')->store('deposit-refund', 'public');
            }

            $transaksi->update([
                'deposit_status' => $depositStatus,
                'deposit_refund_amount' => $refundAmount,
                'deposit_refund_method' => $request->refund_method,
                'deposit_refund_note' => $request->refund_note,
                'deposit_refund_proof' => $proofPath,
                'deposit_refunded_at' => now(),
            ]);

            // Kirim notifikasi ke customer
            $methodLabel = $request->refund_method;
            Notifikasi::create([
                'id_pengguna' => $transaksi->id_penyewa,
                'unique_key' => 'deposit_refund_' . $transaksi->id_transaksi . '_' . time(),
                'type' => 'deposit',
                'title' => 'Deposit Telah Dikembalikan 💰',
                'message' => "Deposit untuk penyewaan \"{$transaksi->nama_barang}\" sebesar Rp " . number_format($refundAmount, 0, ',', '.') . " telah dikembalikan melalui {$methodLabel}." . ($request->refund_note ? " Catatan: {$request->refund_note}" : ''),
                'severity' => 'success',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'deposit_status' => $depositStatus,
                    'refund_amount' => $refundAmount,
                    'refund_method' => $methodLabel,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Refund deposit berhasil diproses',
                'data' => $transaksi->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses refund: ' . $e->getMessage(),
            ], 500);
        }
    }
}
