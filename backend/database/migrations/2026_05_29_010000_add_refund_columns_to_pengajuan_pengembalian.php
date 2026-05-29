<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            $table->decimal('jumlah_refund', 15, 2)->nullable()->after('catatan_admin');
            $table->enum('status_refund', ['belum_refund', 'proses_refund', 'sudah_refund'])->default('belum_refund')->after('jumlah_refund');
            $table->string('metode_refund', 50)->nullable()->after('status_refund'); // transfer_bank, ewallet, etc
            $table->string('bukti_refund')->nullable()->after('metode_refund'); // screenshot bukti transfer
            $table->timestamp('tanggal_refund')->nullable()->after('bukti_refund');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            $table->dropColumn(['jumlah_refund', 'status_refund', 'metode_refund', 'bukti_refund', 'tanggal_refund']);
        });
    }
};
