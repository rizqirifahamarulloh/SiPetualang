<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Ulasan;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UlasanController extends Controller
{
    /**
     * GET /api/ulasan/barang/{id}
     * Public — Get semua ulasan untuk barang tertentu
     */
    public function getByBarang($id)
    {
        $ulasan = Ulasan::where('id_barang', $id)
            ->with(['pengguna:id_pengguna,nama,profile_photo'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Hitung statistik
        $totalUlasan = $ulasan->count();
        $avgRating = $totalUlasan > 0 ? round($ulasan->avg('rating'), 1) : 0;

        // Count per bintang
        $starCounts = [];
        for ($i = 5; $i >= 1; $i--) {
            $starCounts[$i] = $ulasan->where('rating', $i)->count();
        }

        return response()->json([
            'ulasan' => $ulasan,
            'stats' => [
                'total' => $totalUlasan,
                'avg_rating' => $avgRating,
                'star_counts' => $starCounts,
            ],
        ]);
    }

    /**
     * POST /api/customer/ulasan
     * Auth — Submit ulasan baru
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        try {
            $validated = $request->validate([
                'id_transaksi' => 'required|integer|exists:transaksi,id_transaksi',
                'rating' => 'required|integer|min:1|max:5',
                'komentar' => 'nullable|string|max:1000',
                'foto_ulasan' => 'nullable|array|max:5',
                'foto_ulasan.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }

        // Ambil transaksi
        $transaksi = Transaksi::find($request->id_transaksi);

        // Pastikan transaksi milik user (penyewa)
        if ($transaksi->id_penyewa !== $user->id_pengguna) {
            return response()->json(['message' => 'Transaksi bukan milik Anda'], 403);
        }

        // Pastikan status selesai
        if ($transaksi->status_sewa !== 'selesai') {
            return response()->json(['message' => 'Ulasan hanya bisa diberikan untuk transaksi yang sudah selesai'], 400);
        }

        // Pastikan belum pernah review
        $existing = Ulasan::where('id_transaksi', $request->id_transaksi)->first();
        if ($existing) {
            return response()->json(['message' => 'Anda sudah memberikan ulasan untuk transaksi ini'], 409);
        }

        // Handle multiple foto
        $fotoPaths = [];
        if ($request->hasFile('foto_ulasan')) {
            foreach ($request->file('foto_ulasan') as $file) {
                $fotoPaths[] = $file->store('ulasan', 'public');
            }
        }

        $ulasan = Ulasan::create([
            'id_transaksi' => $request->id_transaksi,
            'id_pengguna' => $user->id_pengguna,
            'id_barang' => $transaksi->id_barang,
            'rating' => $request->rating,
            'komentar' => $request->komentar,
            'foto_ulasan' => !empty($fotoPaths) ? $fotoPaths : null,
        ]);

        $ulasan->load('pengguna:id_pengguna,nama,profile_photo');

        return response()->json([
            'message' => 'Ulasan berhasil disimpan',
            'ulasan' => $ulasan,
        ], 201);
    }

    /**
     * GET /api/customer/ulasan/check/{id_transaksi}
     * Auth — Cek apakah sudah review
     */
    public function check($id_transaksi)
    {
        $user = Auth::user();

        $ulasan = Ulasan::where('id_transaksi', $id_transaksi)
            ->where('id_pengguna', $user->id_pengguna)
            ->first();

        return response()->json([
            'has_reviewed' => $ulasan !== null,
            'ulasan' => $ulasan,
        ]);
    }
}
