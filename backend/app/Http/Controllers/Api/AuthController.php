<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuthController extends Controller
{
    // Register
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100',
            'email' => 'required|string|email|max:100|unique:pengguna',
            'password' => 'required|string|min:6|confirmed',
            'no_telp' => 'nullable|string|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $pengguna = Pengguna::create([
            'nama' => $request->nama,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'no_telp' => $request->no_telp,
            'peran_pengguna' => 'customer',
        ]);

        $token = JWTAuth::fromUser($pengguna);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil',
            'user' => array_merge($pengguna->toArray(), ['is_verified' => $pengguna->is_verified]),
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60
        ], 201);
    }

    // Login
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        $user = auth()->user();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'user' => [
                'id_pengguna' => $user->id_pengguna,
                'nama' => $user->nama,
                'email' => $user->email,
                'alamat' => $user->alamat,
                'kota' => $user->kota,
                'no_telp' => $user->no_telp,
                'peran_pengguna' => $user->peran_pengguna,
                'google_id' => $user->google_id,
                'profile_photo' => $user->profile_photo,
                'is_verified' => $user->is_verified,
            ],
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60
        ]);
    }

    // Forgot Password
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:pengguna,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Pengguna::where('email', $request->email)->first();
        $token = Str::random(64);

        // Simpan ke password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => $token,
                'created_at' => Carbon::now()
            ]
        );

        $resetLink = config('app.frontend_url', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        Mail::send('emails.reset-password', [
            'user' => $user,
            'resetLink' => $resetLink
        ], function ($message) use ($user) {
            $message->to($user->email)
                    ->subject('Reset Password - SiPetualang');
        });

        return response()->json([
            'success' => true,
            'message' => 'Link reset password telah dikirim ke email Anda'
        ]);
    }

    // Reset Password (LANGSUNG KASIH TOKEN JWT BARU)
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:pengguna,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Cek token
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset password tidak valid'
            ], 400);
        }

        // Cek kadaluarsa (60 menit)
        if (Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset password sudah kadaluarsa'
            ], 400);
        }

        // Update password
        $user = Pengguna::where('email', $request->email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        // Hapus token reset
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Generate JWT TOKEN BARU biar langsung login
        $newToken = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset',
            'token' => $newToken,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => [
                'id_pengguna' => $user->id_pengguna,
                'nama' => $user->nama,
                'email' => $user->email,
                'alamat' => $user->alamat,
                'kota' => $user->kota,
                'no_telp' => $user->no_telp,
                'peran_pengguna' => $user->peran_pengguna,
                'google_id' => $user->google_id,
                'profile_photo' => $user->profile_photo,
                'rental' => $user->rental,
                'tanggal_lahir' => $user->tanggal_lahir,
                'is_verified' => $user->is_verified,
                'verification_status' => $user->verification_status,
                'verification_note' => $user->verification_note,
            ]
        ]);
    }

    // Google Login Redirect
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Google Login Callback
    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $pengguna = Pengguna::where('email', $googleUser->getEmail())
                ->orWhere('google_id', $googleUser->getId())
                ->first();

            if (!$pengguna) {
                $pengguna = Pengguna::create([
                    'nama' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'peran_pengguna' => 'customer',
                    'google_id' => $googleUser->getId(),
                ]);
            } else {
                if (!$pengguna->google_id) {
                    $pengguna->google_id = $googleUser->getId();
                    $pengguna->save();
                }
            }

            $token = JWTAuth::fromUser($pengguna);

            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            $redirectUrl = $frontendUrl . '/auth/callback?token=' . $token . '&user=' . urlencode(json_encode([
                'id_pengguna' => $pengguna->id_pengguna,
                'nama' => $pengguna->nama,
                'email' => $pengguna->email,
                'peran_pengguna' => $pengguna->peran_pengguna,
            ]));

            return redirect($redirectUrl);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google login gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    // Logout
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout gagal'
            ], 500);
        }
    }

    // Get User Profile
    public function me()
    {
        $user = auth()->user();
        return response()->json([
            'success' => true,
            'user' => [
                'id_pengguna' => $user->id_pengguna,
                'nama' => $user->nama,
                'email' => $user->email,
                'alamat' => $user->alamat,
                'kota' => $user->kota,
                'no_telp' => $user->no_telp,
                'peran_pengguna' => $user->peran_pengguna,
                'google_id' => $user->google_id,
                'profile_photo' => $user->profile_photo,
                'rental' => $user->rental,
                'tanggal_lahir' => $user->tanggal_lahir,
                'is_verified' => $user->is_verified,
                'verification_status' => $user->verification_status,
                'verification_note' => $user->verification_note,
            ]
        ]);
    }

    // Refresh Token
    public function refresh()
    {
        try {
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'token' => $newToken,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Refresh token gagal'
            ], 401);
        }
    }

    // Update Profile
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'nama' => 'sometimes|string|max:100',
            'alamat' => 'sometimes|string',
            'kota' => 'sometimes|string|max:100',
            'no_telp' => 'sometimes|string|max:15',
            'profile_photo' => 'sometimes|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('nama')) {
            $user->nama = $request->nama;
        }
        if ($request->has('alamat')) {
            $user->alamat = $request->alamat;
        }
        if ($request->has('kota')) {
            $user->kota = $request->kota;
        }
        if ($request->has('no_telp')) {
            $user->no_telp = $request->no_telp;
        }
        if ($request->hasFile('profile_photo')) {
            $photoPath = $request->file('profile_photo')->store('profile_photos', 'public');
            $user->profile_photo = $photoPath;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diupdate',
            'user' => $user
        ]);
    }
}
