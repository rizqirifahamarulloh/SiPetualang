<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Verifikasi;

class VerifikasiController extends Controller
{
    // 🔍 Ambil semua data verifikasi
    public function index()
    {
        try {
            $data = Verifikasi::with('pengguna')
                ->orderByDesc('id_verifikasi')
                ->get();

            return response()->json($data);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ✅ Approve KTP
    public function approve(Request $request, $id)
    {
        $verifikasi = Verifikasi::findOrFail($id);

        $verifikasi->status_verifikasi = 'disetujui';
        $verifikasi->catatan_admin = null;
        $verifikasi->save();

        // Update status rental pengguna menjadi true HANYA jika diminta dari React
        if ($request->activate_rental) {
            $pengguna = $verifikasi->pengguna;
            if ($pengguna) {
                $pengguna->rental = 'true';
                $pengguna->save();
            }
        }

        return response()->json([
            'message' => 'Verifikasi disetujui' . ($request->activate_rental ? ' dan fitur rental diaktifkan' : '')
        ]);
    }

    // ❌ Reject KTP
    public function reject(Request $request, $id)
    {
        $request->validate([
            'catatan_admin' => 'required|string'
        ]);

        $verifikasi = Verifikasi::findOrFail($id);

        $verifikasi->status_verifikasi = 'ditolak';
        $verifikasi->catatan_admin = $request->catatan_admin;
        $verifikasi->save();

        return response()->json([
            'message' => 'Verifikasi ditolak'
        ]);
    }

    // 🔍 Detail 1 data (opsional, tapi bagus buat modal/detail page)
    public function show($id)
    {
        $data = Verifikasi::with('pengguna')->findOrFail($id);

        return response()->json($data);
    }
}
