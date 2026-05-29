<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TokoController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\VerifikasiController;
use App\Http\Controllers\Api\Customer\VerifikasiController as CustomerVerifikasi;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\Customer\RentalController;
use App\Http\Controllers\Api\Customer\ChatController;
use App\Http\Controllers\Api\Customer\TransaksiController;
use App\Http\Controllers\Api\Customer\PengajuanPengembalianController;
use App\Http\Controllers\Api\Admin\KategoriController;
use App\Http\Controllers\Api\Admin\DestinasiController;
use App\Http\Controllers\Api\Admin\BarangController as AdminBarangController;
use App\Http\Controllers\Api\NotifikasiController;
use App\Http\Middleware\RoleMiddleware;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (TANPA LOGIN)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::post('/refresh', [AuthController::class, 'refresh']);

// PUBLIC RENTAL ROUTES
Route::get('/rental/barang', [RentalController::class, 'getAvailableBarang']);
Route::get('/rental/barang/{id}', [RentalController::class, 'getBarangById']);
Route::get('/toko/pengguna/{id}', [TokoController::class, 'getPengguna']);
Route::get('/toko/barang/{ownerId}', [TokoController::class, 'getBarangByOwner']);
Route::post('/payment/midtrans/notification', [TransaksiController::class, 'handleNotification']);

/*
|--------------------------------------------------------------------------
| PROTECTED (LOGIN REQUIRED)
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.auth'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // 🏷️ Kategori (semua role terautentikasi)
    Route::get('/kategori', [KategoriController::class, 'index']);

    // 🔔 Notifikasi (semua role)
    Route::get('/notifikasi', [NotifikasiController::class, 'index']);
    Route::patch('/notifikasi/{id}/read', [NotifikasiController::class, 'markRead']);
    Route::delete('/notifikasi/{id}', [NotifikasiController::class, 'destroy']);
    Route::delete('/notifikasi', [NotifikasiController::class, 'destroyAll']);

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */
    Route::prefix('customer')->group(function () {

        Route::post('/verifikasi', [CustomerVerifikasi::class, 'store']);

        // RENTAL ROUTES
        Route::prefix('rental')->group(function () {
            Route::get('/my-barang', [RentalController::class, 'myBarang']);
            Route::post('/barang', [RentalController::class, 'addBarang']);
            Route::put('/barang/{id}', [RentalController::class, 'editBarang']);
            Route::delete('/barang/{id}', [RentalController::class, 'deleteBarang']);
            Route::get('/cart', [RentalController::class, 'getCart']);
            Route::post('/cart', [RentalController::class, 'addToCart']);
            Route::put('/cart/{id}', [RentalController::class, 'updateCart']);
            Route::delete('/cart/{id}', [RentalController::class, 'removeFromCart']);
            Route::post('/checkout', [RentalController::class, 'checkout']);
            Route::get('/transactions', [RentalController::class, 'myTransactions']);
        });

        // 🔥 TRANSACTION ROUTES (Checkout dengan Midtrans)
        Route::prefix('transaksi')->group(function () {
            Route::post('/checkout', [TransaksiController::class, 'checkout']);
            Route::get('/sebagai-penyewa', [TransaksiController::class, 'getTransaksiSebagaiPenyewa']);
            Route::get('/sebagai-pemilik', [TransaksiController::class, 'getTransaksiSebagaiPemilik']);
            Route::put('/{id}/status', [TransaksiController::class, 'updateStatus']);
        });

        // CHAT ROUTES
        Route::prefix('chat')->group(function () {
            Route::get('/conversations', [ChatController::class, 'getConversations']);
            Route::get('/customers', [ChatController::class, 'getAvailableCustomers']);
            Route::post('/conversation/{userId}', [ChatController::class, 'getOrCreateConversation']);
            Route::get('/messages/{conversationId}', [ChatController::class, 'getMessages']);
            Route::post('/message', [ChatController::class, 'sendMessage']);
        });

        // 🚚 Customer Shipping Routes
        Route::prefix('pengiriman')->group(function () {
            Route::get('/list', [\App\Http\Controllers\Api\PengirimanController::class, 'getTrackingList']);
            Route::get('/{id_transaksi}/tracking', [\App\Http\Controllers\Api\PengirimanController::class, 'getTracking']);
            Route::post('/{id}/terima', [\App\Http\Controllers\Api\PengirimanController::class, 'konfirmasiDiterima']);
            Route::post('/{id}/kembalikan', [\App\Http\Controllers\Api\PengirimanController::class, 'customerKembalikanBarang']);
        });

        // 📦 Pengajuan Pengembalian Routes
        Route::prefix('pengembalian')->group(function () {
            Route::post('/', [PengajuanPengembalianController::class, 'store']);
            Route::get('/', [PengajuanPengembalianController::class, 'myRequests']);
            Route::get('/sebagai-pemilik', [PengajuanPengembalianController::class, 'getByPemilik']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY
    |--------------------------------------------------------------------------
    */
    Route::middleware([RoleMiddleware::class . ':admin'])->prefix('admin')->group(function () {

        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetPassword']);
        Route::apiResource('/users', AdminController::class);
        Route::get('/verifikasi', [VerifikasiController::class, 'index']);
        Route::get('/verifikasi/{id}', [VerifikasiController::class, 'show']);
        Route::post('/verifikasi/{id}/approve', [VerifikasiController::class, 'approve']);
        Route::post('/verifikasi/{id}/reject', [VerifikasiController::class, 'reject']);

        Route::get('/verifikasi-barang/pending', [\App\Http\Controllers\Api\Admin\VerifikasiBarangController::class, 'getPendingBarang']);
        Route::get('/verifikasi-barang', [\App\Http\Controllers\Api\Admin\VerifikasiBarangController::class, 'getAllBarang']);
        Route::post('/verifikasi-barang/approve/{id}', [\App\Http\Controllers\Api\Admin\VerifikasiBarangController::class, 'approveBarang']);
        Route::post('/verifikasi-barang/reject/{id}', [\App\Http\Controllers\Api\Admin\VerifikasiBarangController::class, 'rejectBarang']);

        Route::get('/revenue', [AdminController::class, 'getRevenueStats']);
        Route::get('/transactions', [AdminController::class, 'getAllTransactions']);
        Route::get('/owner-earnings', [AdminController::class, 'getOwnerEarnings']);

        // 🔥 Kategori & Destinasi
        Route::apiResource('/kategori', KategoriController::class);
        Route::apiResource('/destinasi', DestinasiController::class);

        // 🔥 Manajemen Alat (Gears)
        Route::get('/barang/stats', [AdminBarangController::class, 'stats']);
        Route::apiResource('/barang', AdminBarangController::class);

        // 🚚 Shipping & Delivery Routes
        Route::get('/pengiriman', [\App\Http\Controllers\Api\PengirimanController::class, 'getAllPengiriman']);
        Route::post('/pengiriman/{id}/kirim', [\App\Http\Controllers\Api\PengirimanController::class, 'kirimBarang']);
        Route::put('/pengiriman/{id}/lokasi', [\App\Http\Controllers\Api\PengirimanController::class, 'updateLokasi']);
        Route::get('/pengiriman/disewa', [\App\Http\Controllers\Api\PengirimanController::class, 'adminGetBarangDisewa']);
        Route::post('/pengiriman/{id}/konfirmasi-kembali', [\App\Http\Controllers\Api\PengirimanController::class, 'adminKonfirmasiKembali']);
        Route::post('/pengiriman/{id}/pickup-diambil', [\App\Http\Controllers\Api\PengirimanController::class, 'pickupBarangDiambil']);

        // 📦 Admin Pengajuan Pengembalian
        Route::get('/pengembalian', [PengajuanPengembalianController::class, 'index']);
        Route::post('/pengembalian/{id}/approve', [PengajuanPengembalianController::class, 'approve']);
        Route::post('/pengembalian/{id}/reject', [PengajuanPengembalianController::class, 'reject']);
        Route::post('/pengembalian/{id}/confirm-refund', [PengajuanPengembalianController::class, 'confirmRefund']);
    });

    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::post('/photo', [ProfileController::class, 'updatePhoto']);
        Route::delete('/photo', [ProfileController::class, 'deletePhoto']);
        Route::post('/password', [ProfileController::class, 'updatePassword']);
        Route::post('/rental', [ProfileController::class, 'openRental']);
        Route::delete('/', [ProfileController::class, 'destroy']);
    });
});
