<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenisDestinasi;
use Illuminate\Http\Request;

class DestinasiController extends Controller
{
    public function index()
    {
        $destinasi = JenisDestinasi::orderBy('id_destinasi')->get();
        return response()->json([
            'status' => 'success',
            'data' => $destinasi
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_destinasi' => 'required|string|max:50'
        ]);

        $destinasi = JenisDestinasi::create([
            'nama_destinasi' => $request->nama_destinasi
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Destinasi berhasil ditambahkan',
            'data' => $destinasi
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_destinasi' => 'required|string|max:50'
        ]);

        $destinasi = JenisDestinasi::findOrFail($id);
        $destinasi->update([
            'nama_destinasi' => $request->nama_destinasi
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Destinasi berhasil diperbarui',
            'data' => $destinasi
        ]);
    }

    public function destroy($id)
    {
        $destinasi = JenisDestinasi::findOrFail($id);
        $destinasi->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Destinasi berhasil dihapus'
        ]);
    }
}
