<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_sewa ENUM('menunggu_pembayaran','dibayar','sedang_disewa','selesai','dibatalkan','refund','aktif') NOT NULL DEFAULT 'menunggu_pembayaran'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE transaksi MODIFY COLUMN status_sewa ENUM('menunggu_pembayaran','dibayar','sedang_disewa','selesai','dibatalkan') NOT NULL DEFAULT 'menunggu_pembayaran'");
    }
};
