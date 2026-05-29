<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\Barang;
use Illuminate\Http\Request;

class TokoController extends Controller
{
    public function getPengguna($id)
    {
        $user = Pengguna::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function getBarangByOwner($ownerId)
    {
        // SEMENTARA: Hapus filter untuk debugging
        $barang = Barang::with(['pemilik', 'kategori'])
            ->withCount('detailTransaksi as total_disewa')
            ->where('id_pemilik', $ownerId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $barang
        ]);
    }
}
