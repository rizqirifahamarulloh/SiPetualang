<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pengguna;
use App\Models\Barang;
use App\Models\Kategori;
use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Ulasan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DummyRentalSeeder extends Seeder
{
    public function run()
    {
        // 1. ADMIN
        $admin = Pengguna::updateOrCreate(
            ['email' => 'admin@sipetualang.com'],
            [
                'nama' => 'Admin SiPetualang',
                'password' => Hash::make('password'),
                'alamat' => 'Jl. Admin No. 1',
                'kota' => 'Jakarta',
                'no_telp' => '081234567890',
                'peran_pengguna' => 'admin',
            ]
        );

        // 2. CUSTOMER
        $penyewa = Pengguna::updateOrCreate(
            ['email' => 'penyewa@test.com'],
            [
                'nama' => 'Budi Penyewa',
                'alamat' => 'Jl. Penyewa No. 2',
                'kota' => 'Bandung',
                'password' => Hash::make('password'),
                'no_telp' => '081234567891',
                'peran_pengguna' => 'customer',
            ]
        );

        $perental = Pengguna::updateOrCreate(
            ['email' => 'perental@test.com'],
            [
                'nama' => 'Budi Perental',
                'alamat' => 'Jl. Perental No. 1',
                'kota' => 'Jakarta',
                'password' => Hash::make('password'),
                'no_telp' => '081234567891',
                'peran_pengguna' => 'perental',
                'rental' => 'true',
            ]
        );

        // 3. KATEGORI
        $kategori1 = Kategori::first();
        if (!$kategori1) {
            $kategori1 = Kategori::create(['nama_kategori' => 'Alat Camping']);
        }

        // 4. BARANG RENTAL (Perental menyewakan barang)

        // Copy gambar barang dari frontend assets ke storage
        $assetsPath = base_path('../frontend/src/assets/sewaalat');
        $storagePath = storage_path('app/public/barang');
        if (!File::isDirectory($storagePath)) {
            File::makeDirectory($storagePath, 0755, true);
        }

        $imageMap = [
            'tenda-dome-4-orang.png' => 'barang/tenda-dome-4-orang.png',
            'kompor-portable.png' => 'barang/kompor-portable.png',
            'sleeping-bag.png' => 'barang/sleeping-bag.png',
        ];

        foreach ($imageMap as $filename => $destPath) {
            $source = $assetsPath . '/' . $filename;
            $dest = storage_path('app/public/' . $destPath);
            if (File::exists($source)) {
                File::copy($source, $dest);
            }
        }

        $barang1 = Barang::updateOrCreate(
            [
                'id_pemilik' => $perental->id_pengguna,
                'nama_barang' => 'Tenda Dome 4 Orang'
            ],
            [
                'id_kategori' => $kategori1->id_kategori,
                'deskripsi' => 'Tenda dome anti air, cocok untuk camping',
                'harga_sewa' => 75000,
                'nominal_deposit' => 50000,
                'jumlah_stok' => 5,
                'status_barang' => 'tersedia',
                'status_approval' => 'disetujui',
                'foto_barang' => 'barang/tenda-dome-4-orang.png',
            ]
        );

        $barang2 = Barang::updateOrCreate(
            [
                'id_pemilik' => $perental->id_pengguna,
                'nama_barang' => 'Kompor Portable'
            ],
            [
                'id_kategori' => $kategori1->id_kategori,
                'deskripsi' => 'Kompor camping portable + gas',
                'harga_sewa' => 35000,
                'nominal_deposit' => 20000,
                'jumlah_stok' => 4,
                'status_barang' => 'tersedia',
                'status_approval' => 'disetujui',
                'foto_barang' => 'barang/kompor-portable.png',
            ]
        );

        $barang3 = Barang::updateOrCreate(
            [
                'id_pemilik' => $perental->id_pengguna,
                'nama_barang' => 'Sleeping Bag'
            ],
            [
                'id_kategori' => $kategori1->id_kategori,
                'deskripsi' => 'Sleeping bag tahan dingin',
                'harga_sewa' => 30000,
                'nominal_deposit' => 15000,
                'jumlah_stok' => 6,
                'status_barang' => 'tersedia',
                'status_approval' => 'disetujui',
                'foto_barang' => 'barang/sleeping-bag.png',
            ]
        );

        // 5. TRANSAKSI RENTAL (Penyewa menyewa dari Perental) - VERSI UPDATE

        // Transaksi 1: Penyewa rental Tenda
        $transaksi1 = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang1->id_barang,
            'nama_barang' => $barang1->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang1->harga_sewa,
            'tanggal_mulai' => '2024-12-25',
            'tanggal_selesai' => '2024-12-27',
            'total_hari' => 3,
            'total_biaya' => 225000,
            'nominal_deposit' => 100000,
            'fee_admin' => 45000,      // 20%
            'pendapatan_pemilik' => 180000, // 80%
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'sedang_disewa',
            'status_pembayaran' => 'sukses',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi1->id_transaksi,
            'id_barang' => $barang1->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 225000,
        ]);

        // Transaksi 2: Penyewa rental Kompor
        $transaksi2 = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang2->id_barang,
            'nama_barang' => $barang2->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang2->harga_sewa,
            'tanggal_mulai' => '2024-12-28',
            'tanggal_selesai' => '2024-12-30',
            'total_hari' => 3,
            'total_biaya' => 105000,
            'nominal_deposit' => 50000,
            'fee_admin' => 21000,
            'pendapatan_pemilik' => 84000,
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'dibayar',
            'status_pembayaran' => 'sukses',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi2->id_transaksi,
            'id_barang' => $barang2->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 105000,
        ]);

        // Transaksi 3: Penyewa rental Sleeping Bag
        $transaksi3 = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang3->id_barang,
            'nama_barang' => $barang3->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang3->harga_sewa,
            'tanggal_mulai' => '2025-01-05',
            'tanggal_selesai' => '2025-01-08',
            'total_hari' => 4,
            'total_biaya' => 120000,
            'nominal_deposit' => 60000,
            'fee_admin' => 24000,
            'pendapatan_pemilik' => 96000,
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'menunggu_pembayaran',
            'status_pembayaran' => 'pending',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi3->id_transaksi,
            'id_barang' => $barang3->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 120000,
        ]);

        // Transaksi 4: Penyewa rental Sleeping Bag (SUDAH KEMBALI & TERLAMBAT 5 HARI)
        $transaksi4 = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang3->id_barang,
            'nama_barang' => $barang3->nama_barang,
            'jumlah' => 2,
            'harga_per_hari' => $barang3->harga_sewa,
            'tanggal_mulai' => '2024-12-10',
            'tanggal_selesai' => '2024-12-15',
            'total_hari' => 6,
            'total_biaya' => 360000,
            'nominal_deposit' => 150000,
            'fee_admin' => 72000,
            'pendapatan_pemilik' => 288000,
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'selesai',
            'status_pembayaran' => 'sukses',
            'tanggal_kembali_real' => '2024-12-20',
            'deposit_status' => 'pending',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi4->id_transaksi,
            'id_barang' => $barang3->id_barang,
            'jumlah_pinjam' => 2,
            'subtotal' => 360000,
        ]);

        \App\Models\Pengembalian::create([
            'id_transaksi' => $transaksi4->id_transaksi,
            'tanggal_kembali' => '2024-12-20',
            'jumlah_kembali' => 2,
            'denda_per_hari' => 20000,
            'total_denda' => 100000, // 5 hari x 20000
            'status_pengembalian' => 'terlambat',
            'kondisi_barang' => 'baik',
            'catatan' => 'Terlambat mengembalikan selama 5 hari karena cuaca buruk di gunung.'
        ]);

        // Transaksi 4b: Penyewa rental Tenda Dome (SELESAI - untuk ulasan)
        $transaksi4b = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang1->id_barang,
            'nama_barang' => $barang1->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang1->harga_sewa,
            'tanggal_mulai' => '2024-11-01',
            'tanggal_selesai' => '2024-11-03',
            'total_hari' => 3,
            'total_biaya' => 225000,
            'nominal_deposit' => 100000,
            'fee_admin' => 45000,
            'pendapatan_pemilik' => 180000,
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'selesai',
            'status_pembayaran' => 'sukses',
            'tanggal_kembali_real' => '2024-11-03',
            'deposit_status' => 'pending',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi4b->id_transaksi,
            'id_barang' => $barang1->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 225000,
        ]);

        // Transaksi 4c: Penyewa rental Kompor Portable (SELESAI - untuk ulasan)
        $transaksi4c = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang2->id_barang,
            'nama_barang' => $barang2->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang2->harga_sewa,
            'tanggal_mulai' => '2024-10-15',
            'tanggal_selesai' => '2024-10-17',
            'total_hari' => 3,
            'total_biaya' => 105000,
            'nominal_deposit' => 50000,
            'fee_admin' => 21000,
            'pendapatan_pemilik' => 84000,
            'metode_pengiriman' => 'pickup',
            'status_sewa' => 'selesai',
            'status_pembayaran' => 'sukses',
            'tanggal_kembali_real' => '2024-10-17',
            'deposit_status' => 'pending',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi4c->id_transaksi,
            'id_barang' => $barang2->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 105000,
        ]);

        // Pengembalian untuk transaksi4b (Tenda Dome - tepat waktu, kondisi baik)
        \App\Models\Pengembalian::create([
            'id_transaksi' => $transaksi4b->id_transaksi,
            'tanggal_kembali' => '2024-11-03',
            'jumlah_kembali' => 1,
            'denda_per_hari' => 20000,
            'total_denda' => 0,
            'denda_kerusakan' => 0,
            'status_pengembalian' => 'tepat_waktu',
            'kondisi_barang' => 'baik',
            'catatan' => 'Barang kembali dalam kondisi sempurna.'
        ]);

        // Pengembalian untuk transaksi4c (Kompor - tepat waktu, kondisi baik)
        \App\Models\Pengembalian::create([
            'id_transaksi' => $transaksi4c->id_transaksi,
            'tanggal_kembali' => '2024-10-17',
            'jumlah_kembali' => 1,
            'denda_per_hari' => 20000,
            'total_denda' => 0,
            'denda_kerusakan' => 0,
            'status_pengembalian' => 'tepat_waktu',
            'kondisi_barang' => 'baik',
            'catatan' => 'Kompor kembali dengan kondisi baik.'
        ]);

        // ===== 5b. ULASAN (Review untuk transaksi selesai) =====

        // Ulasan untuk Sleeping Bag (transaksi4 - selesai)
        Ulasan::create([
            'id_transaksi' => $transaksi4->id_transaksi,
            'id_pengguna' => $penyewa->id_pengguna,
            'id_barang' => $barang3->id_barang,
            'rating' => 4,
            'komentar' => 'Sleeping bag cukup hangat dan nyaman dipakai di gunung. Kondisi barang terawat dengan baik. Pemilik juga ramah dan fast response.',
        ]);

        // Ulasan untuk Tenda Dome (transaksi4b - selesai)
        Ulasan::create([
            'id_transaksi' => $transaksi4b->id_transaksi,
            'id_pengguna' => $penyewa->id_pengguna,
            'id_barang' => $barang1->id_barang,
            'rating' => 5,
            'komentar' => 'Tenda dome kualitas terbaik! Waterproof, kokoh, dan mudah dipasang. Sangat recommended untuk camping bareng keluarga.',
        ]);

        // Ulasan untuk Kompor Portable (transaksi4c - selesai)
        Ulasan::create([
            'id_transaksi' => $transaksi4c->id_transaksi,
            'id_pengguna' => $penyewa->id_pengguna,
            'id_barang' => $barang2->id_barang,
            'rating' => 3,
            'komentar' => 'Kompor berfungsi dengan baik tapi sedikit sulit dinyalakan saat angin kencang. Secara keseluruhan oke lah untuk harga segini.',
        ]);

        // Transaksi 5: Penyewa rental Tenda Dome via DELIVERY (Untuk Uji Coba Pengiriman)
        $transaksi5 = Transaksi::create([
            'id_penyewa' => $penyewa->id_pengguna,
            'id_pemilik' => $perental->id_pengguna,
            'id_barang' => $barang1->id_barang,
            'nama_barang' => $barang1->nama_barang,
            'jumlah' => 1,
            'harga_per_hari' => $barang1->harga_sewa,
            'tanggal_mulai' => '2026-06-01',
            'tanggal_selesai' => '2026-06-03',
            'total_hari' => 3,
            'total_biaya' => 240000, // (75000 * 3) + 15000 biaya kirim
            'nominal_deposit' => 100000,
            'fee_admin' => 45000,
            'pendapatan_pemilik' => 180000,
            'metode_pengiriman' => 'delivery',
            'alamat_pengiriman' => 'Jl. Merdeka No. 45, Coblong, Bandung',
            'biaya_pengiriman' => 15000,
            'status_sewa' => 'dibayar',
            'status_pembayaran' => 'sukses',
        ]);

        DetailTransaksi::create([
            'id_transaksi' => $transaksi5->id_transaksi,
            'id_barang' => $barang1->id_barang,
            'jumlah_pinjam' => 1,
            'subtotal' => 225000,
        ]);

        // 6. CHAT ANTAR CUSTOMER (Penyewa <-> Perental)
        $chat = Conversation::updateOrCreate(
            [
                'id_user_a' => min($penyewa->id_pengguna, $perental->id_pengguna),
                'id_user_b' => max($penyewa->id_pengguna, $perental->id_pengguna),
            ],
            ['last_message_at' => now()]
        );

        // Pesan dari Penyewa ke Perental
        Message::create([
            'id_conversation' => $chat->id_conversation,
            'id_sender' => $penyewa->id_pengguna,
            'message' => 'Halo Bang, tendanya masih tersedia untuk tanggal 25-27 Desember?',
            'is_read' => true,
        ]);

        // Balasan dari Perental
        Message::create([
            'id_conversation' => $chat->id_conversation,
            'id_sender' => $perental->id_pengguna,
            'message' => 'Masih tersedia. Mau berapa unit?',
            'is_read' => true,
        ]);

        // Pesan lanjutan dari Penyewa
        Message::create([
            'id_conversation' => $chat->id_conversation,
            'id_sender' => $penyewa->id_pengguna,
            'message' => '1 unit aja. Apakah bisa antar ke daerah Bandung?',
            'is_read' => false,
        ]);

        $this->command->info('✅ Dummy rental berhasil dibuat!');
        $this->command->info('📊 Customer: penyewa@test.com (Budi Penyewa) & perental@test.com (Budi Perental)');
        $this->command->info('📦 Barang: 3 item dari Perental');
        $this->command->info('💰 Transaksi: 7 transaksi dari Penyewa');
        $this->command->info('⭐ Ulasan: 3 ulasan dari Penyewa');
        $this->command->info('💬 Chat: 3 pesan antara Penyewa dan Perental');
    }
}
