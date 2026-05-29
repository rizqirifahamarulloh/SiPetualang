<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\Transaksi;
use App\Models\Barang;
use App\Models\PengajuanPengembalian;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Admin Dashboard
     */
    public function dashboard()
    {
        try {
            $admin = auth()->user();

            // Pastikan user adalah admin
            if ($admin->peran_pengguna !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses hanya untuk admin'
                ], 403);
            }

            // Hitung statistik utama
            $totalUsers = Pengguna::count();
            $totalGears = Barang::count();
            $totalTransactions = Transaksi::where('status_pembayaran', 'sukses')->count();
            $totalRevenue = Transaksi::where('status_pembayaran', 'sukses')->sum('total_biaya');

            // Hitung total refund (yang sudah disetujui/selesai)
            $totalRefund = PengajuanPengembalian::whereIn('status', ['disetujui'])
                ->sum('jumlah_refund');

            $totalRefundCount = PengajuanPengembalian::whereIn('status', ['disetujui', 'pending'])
                ->count();

            $stats = [
                'total_users' => $totalUsers,
                'total_gears' => $totalGears,
                'total_transactions' => $totalTransactions,
                'total_revenue' => (float) $totalRevenue,
                'total_refund' => (float) $totalRefund,
                'total_refund_count' => $totalRefundCount,
                'net_revenue' => (float) ($totalRevenue - $totalRefund),
            ];

            // Mapping status dari DB ke frontend
            $statusMap = [
                'menunggu_pembayaran' => 'pending_payment',
                'dibayar' => 'paid',
                'sedang_disewa' => 'rented',
                'selesai' => 'completed',
                'dibatalkan' => 'cancelled',
            ];

            // Ambil 5 transaksi terbaru
            $recentTransactions = Transaksi::with(['penyewa'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($trx) use ($statusMap) {
                    return [
                        'id' => $trx->id_transaksi,
                        'transaction_code' => $trx->midtrans_order_id ?? ('TRX-' . $trx->id_transaksi),
                        'customer' => [
                            'name' => $trx->penyewa ? $trx->penyewa->nama : 'Customer'
                        ],
                        'destination' => [
                            'name' => $trx->nama_barang
                        ],
                        'total_cost' => (float) $trx->total_biaya,
                        'status' => $statusMap[$trx->status_sewa] ?? 'pending_payment'
                    ];
                });

            // Ambil 5 barang dengan stok menipis (<= 1)
            $lowStockGears = Barang::with('kategori')
                ->where('jumlah_stok', '<=', 1)
                ->limit(5)
                ->get()
                ->map(function ($gear) {
                    return [
                        'id' => $gear->id_barang,
                        'name' => $gear->nama_barang,
                        'category' => [
                            'name' => $gear->kategori ? $gear->kategori->nama_kategori : 'Kategori'
                        ],
                        'stock' => $gear->jumlah_stok
                    ];
                });

            // Monthly revenue + refund data (12 bulan terakhir)
            $monthlyRevenue = Transaksi::where('status_pembayaran', 'sukses')
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as bulan, SUM(total_biaya) as total, SUM(fee_admin) as fee_admin, SUM(pendapatan_pemilik) as pendapatan_pemilik")
                ->groupBy('bulan')
                ->orderBy('bulan')
                ->get();

            // Monthly refund data
            $monthlyRefund = PengajuanPengembalian::whereIn('status', ['disetujui'])
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as bulan, SUM(jumlah_refund) as total_refund, COUNT(*) as jumlah")
                ->groupBy('bulan')
                ->orderBy('bulan')
                ->get();

            // Merge refund into monthly revenue
            $monthlyData = $monthlyRevenue->map(function ($item) use ($monthlyRefund) {
                $refund = $monthlyRefund->firstWhere('bulan', $item->bulan);
                return [
                    'bulan' => $item->bulan,
                    'total' => (float) $item->total,
                    'fee_admin' => (float) $item->fee_admin,
                    'pendapatan_pemilik' => (float) $item->pendapatan_pemilik,
                    'refund' => $refund ? (float) $refund->total_refund : 0,
                    'refund_count' => $refund ? (int) $refund->jumlah : 0,
                ];
            });

            // Add months that only have refunds but no revenue
            $monthlyRefund->each(function ($refund) use (&$monthlyData) {
                if (!$monthlyData->contains('bulan', $refund->bulan)) {
                    $monthlyData->push([
                        'bulan' => $refund->bulan,
                        'total' => 0,
                        'fee_admin' => 0,
                        'pendapatan_pemilik' => 0,
                        'refund' => (float) $refund->total_refund,
                        'refund_count' => (int) $refund->jumlah,
                    ]);
                }
            });

            // Recent refunds
            $recentRefunds = PengajuanPengembalian::with(['transaksi', 'customer'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($r) {
                    return [
                        'id' => $r->id_pengajuan,
                        'customer' => $r->customer ? $r->customer->nama : '-',
                        'barang' => $r->transaksi ? $r->transaksi->nama_barang : '-',
                        'jumlah_refund' => (float) $r->jumlah_refund,
                        'status' => $r->status,
                        'status_refund' => $r->status_refund,
                        'created_at' => $r->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Dashboard admin',
                'data' => [
                    'stats' => $stats,
                    'recent_transactions' => $recentTransactions,
                    'low_stock_alerts' => $lowStockGears,
                    'monthly_revenue' => $monthlyData->sortBy('bulan')->values(),
                    'recent_refunds' => $recentRefunds,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get All Users
     */
    public function index()
    {
        try {
            $users = Pengguna::select([
                'id_pengguna',
                'nama',
                'email',
                'alamat',
                'kota',
                'no_telp',
                'peran_pengguna',
            ])->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a New User
     */
    public function store(Request $request)
    {
        try {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'nama' => 'required|string|max:100',
                'email' => 'required|string|email|max:100|unique:pengguna,email',
                'password' => 'required|string|min:6',
                'alamat' => 'nullable|string',
                'kota' => 'nullable|string|max:100',
                'no_telp' => 'nullable|string|max:15',
                'peran_pengguna' => 'required|in:customer,admin',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Pengguna::create([
                'nama' => $request->nama,
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'alamat' => $request->alamat,
                'kota' => $request->kota,
                'no_telp' => $request->no_telp,
                'peran_pengguna' => $request->peran_pengguna,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get User Details
     */
    public function show($id)
    {
        try {
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update User
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Pengguna::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'nama' => 'sometimes|required|string|max:100',
                'email' => 'sometimes|required|string|email|max:100|unique:pengguna,email,' . $id . ',id_pengguna',
                'password' => 'nullable|string|min:6',
                'alamat' => 'nullable|string',
                'kota' => 'nullable|string|max:100',
                'no_telp' => 'nullable|string|max:15',
                'peran_pengguna' => 'sometimes|required|in:customer,admin',
                'rental' => 'sometimes|required|in:true,false',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->has('nama'))
                $user->nama = $request->nama;
            if ($request->has('email'))
                $user->email = $request->email;
            if ($request->has('password') && !empty($request->password)) {
                $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
            }
            if ($request->has('alamat'))
                $user->alamat = $request->alamat;
            if ($request->has('kota'))
                $user->kota = $request->kota;
            if ($request->has('no_telp'))
                $user->no_telp = $request->no_telp;
            if ($request->has('peran_pengguna'))
                $user->peran_pengguna = $request->peran_pengguna;
            if ($request->has('rental'))
                $user->rental = $request->rental;

            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete User
     */
    public function destroy($id)
    {
        try {
            $user = Pengguna::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset User Password to default
     */
    public function resetPassword($id)
    {
        try {
            $user = Pengguna::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->password = \Illuminate\Support\Facades\Hash::make('password');
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully to default'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Revenue Statistics (Pembagian Hasil)
     */
    public function getRevenueStats()
    {
        try {
            $totalRevenue = Transaksi::where('status_pembayaran', 'sukses')->sum('total_biaya');
            $totalFeeAdmin = Transaksi::where('status_pembayaran', 'sukses')->sum('fee_admin');
            $totalPendapatanPemilik = Transaksi::where('status_pembayaran', 'sukses')->sum('pendapatan_pemilik');
            $totalTransaksi = Transaksi::where('status_pembayaran', 'sukses')->count();

            // Pendapatan per pemilik (perental)
            $ownerEarnings = Pengguna::where('peran_pengguna', 'customer')
                ->get()
                ->map(function ($owner) {
                    $totalPendapatan = Transaksi::where('id_pemilik', $owner->id_pengguna)
                        ->where('status_pembayaran', 'sukses')
                        ->sum('pendapatan_pemilik');

                    $totalTransaksi = Transaksi::where('id_pemilik', $owner->id_pengguna)
                        ->where('status_pembayaran', 'sukses')
                        ->count();

                    return [
                        'id_pengguna' => $owner->id_pengguna,
                        'nama' => $owner->nama,
                        'email' => $owner->email,
                        'total_pendapatan' => (float) $totalPendapatan,
                        'total_transaksi' => $totalTransaksi,
                    ];
                })
                ->filter(function ($owner) {
                    return $owner['total_transaksi'] > 0;
                })
                ->values();

            $totalRefund = PengajuanPengembalian::whereIn('status', ['disetujui'])
                ->sum('jumlah_refund');

            $transactions = Transaksi::with(['penyewa', 'pemilik', 'barang'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'total_revenue' => (float) $totalRevenue,
                        'total_fee_admin' => (float) $totalFeeAdmin,
                        'total_pendapatan_pemilik' => (float) $totalPendapatanPemilik,
                        'total_transaksi' => $totalTransaksi,
                        'total_refund' => (float) $totalRefund,
                        'net_revenue' => (float) ($totalRevenue - $totalRefund),
                    ],
                    'owner_earnings' => $ownerEarnings,
                    'transactions' => $transactions,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get All Transactions
     */
    public function getAllTransactions()
    {
        try {
            $transactions = Transaksi::with(['penyewa', 'pemilik', 'barang'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Owner Earnings
     */
    public function getOwnerEarnings()
    {
        try {
            $ownerEarnings = Pengguna::where('peran_pengguna', 'customer')
                ->get()
                ->map(function ($owner) {
                    $totalPendapatan = Transaksi::where('id_pemilik', $owner->id_pengguna)
                        ->where('status_pembayaran', 'sukses')
                        ->sum('pendapatan_pemilik');

                    $totalTransaksi = Transaksi::where('id_pemilik', $owner->id_pengguna)
                        ->where('status_pembayaran', 'sukses')
                        ->count();

                    return [
                        'id_pengguna' => $owner->id_pengguna,
                        'nama' => $owner->nama,
                        'email' => $owner->email,
                        'total_pendapatan' => (float) $totalPendapatan,
                        'total_transaksi' => $totalTransaksi,
                    ];
                })
                ->filter(function ($owner) {
                    return $owner['total_transaksi'] > 0;
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $ownerEarnings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

