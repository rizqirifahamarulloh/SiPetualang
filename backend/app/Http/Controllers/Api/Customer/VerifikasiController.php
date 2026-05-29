<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Verifikasi;
use Tymon\JWTAuth\Facades\JWTAuth;

class VerifikasiController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'foto_ktp' => 'required|image|mimes:jpg,jpeg,png|max:5120',
            'foto_selfie_ktp' => 'required|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        if (!$request->hasFile('foto_ktp') || !$request->hasFile('foto_selfie_ktp')) {
            return response()->json([
                'success' => false,
                'message' => 'File foto KTP dan selfie harus diunggah'
            ], 422);
        }

        $user = JWTAuth::parseToken()->authenticate();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan dari token'
            ], 401);
        }

        // simpan file
        $ktp = $request->file('foto_ktp')->store('ktp', 'public');
        $selfie = $request->file('foto_selfie_ktp')->store('selfie', 'public');

        // simpan ke DB
        Verifikasi::create([
            'id_pengguna' => $user->id_pengguna,
            'foto_ktp' => $ktp,
            'foto_selfie_ktp' => $selfie,
            'status_verifikasi' => 'pending',
            'catatan_admin' => $request->catatan_admin // Flag pendaftaran rental
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil kirim verifikasi'
        ]);
    }
}
