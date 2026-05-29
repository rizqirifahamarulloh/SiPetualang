<?php
// app/Http/Controllers/Api/ProfileController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show()
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id_pengguna,
                'name' => $user->nama,
                'email' => $user->email,
                'phone' => $user->no_telp,
                'address' => $user->alamat,
                'city' => $user->kota,
                'role' => $user->peran_pengguna,
                'google_id' => $user->google_id,
                'profile_photo' => $user->profile_photo,
                'rental' => $user->rental,
                'tanggal_lahir' => $user->tanggal_lahir ? $user->tanggal_lahir->format('Y-m-d') : null,
                'verification_status' => $user->verification_status,
                'verification_note' => $user->verification_note,
                'is_verified' => $user->is_verified,
                'rental_status' => $user->rental_status,
                'rental_note' => $user->rental_note,
            ]
        ]);
    }

    /**
     * Update profile (name, phone, address, city)
     */
    public function update(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:15',
            'address' => 'sometimes|required|string',
            'city' => 'sometimes|required|string|max:100',
            'birth_date' => 'sometimes|required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->filled('name')) {
            $user->nama = $request->name;
        }
        if ($request->filled('phone')) {
            $user->no_telp = $request->phone;
        }
        if ($request->filled('address')) {
            $user->alamat = $request->address;
        }
        if ($request->filled('city')) {
            $user->kota = $request->city;
        }
        if ($request->filled('birth_date')) {
            $user->tanggal_lahir = $request->birth_date;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diupdate',
            'data' => $user
        ]);
    }

    /**
     * Update profile photo
     */
    public function updatePhoto(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'profile_photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Hapus foto lama jika ada
        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        // Upload foto baru
        $path = $request->file('profile_photo')->store('profile-photos', 'public');
        $user->profile_photo = $path;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diupdate',
            'profile_photo' => $path
        ]);
    }

    /**
     * Delete profile photo
     */
    public function deletePhoto()
    {
        $user = auth()->user();

        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
            $user->profile_photo = null;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus'
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Cek current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini salah'
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diupdate'
        ]);
    }


    /**
     * Delete account
     */
    public function destroy(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Cek password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password salah'
            ], 422);
        }

        // Hapus foto-foto
        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        // Hapus user
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil dihapus'
        ]);
    }

    /**
     * Set rental to true
     */
    public function openRental()
    {
        $user = auth()->user();
        $user->rental = 'true';
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Status rental berhasil diperbarui',
            'rental' => $user->rental
        ]);
    }
}
