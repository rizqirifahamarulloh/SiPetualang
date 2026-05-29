<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            // Metode pengembalian barang
            $table->enum('metode_pengembalian', ['pickup', 'delivery'])->default('pickup')->after('foto_bukti');
            $table->text('alamat_pengembalian')->nullable()->after('metode_pengembalian');
            $table->decimal('biaya_ongkir_pengembalian', 12, 2)->default(0)->after('alamat_pengembalian');

            // Breakdown refund dinamis
            $table->integer('sisa_hari_sewa')->nullable()->after('biaya_ongkir_pengembalian');
            $table->decimal('refund_sewa', 15, 2)->nullable()->after('sisa_hari_sewa');
            $table->decimal('refund_deposit', 15, 2)->nullable()->after('refund_sewa');
            $table->decimal('potongan_admin_fee', 15, 2)->nullable()->after('refund_deposit');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            $table->dropColumn([
                'metode_pengembalian',
                'alamat_pengembalian',
                'biaya_ongkir_pengembalian',
                'sisa_hari_sewa',
                'refund_sewa',
                'refund_deposit',
                'potongan_admin_fee',
            ]);
        });
    }
};
