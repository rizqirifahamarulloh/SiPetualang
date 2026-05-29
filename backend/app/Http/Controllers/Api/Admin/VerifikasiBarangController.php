<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;

class VerifikasiBarangController extends Controller
{
    public function getPendingBarang()
    {
        return response()->json(['data' => []]);
    }

    public function getAllBarang()
    {
        return response()->json(['data' => []]);
    }

    public function approveBarang($id)
    {
        return response()->json(['message' => 'Approved']);
    }

    public function rejectBarang($id)
    {
        return response()->json(['message' => 'Rejected']);
    }
}
