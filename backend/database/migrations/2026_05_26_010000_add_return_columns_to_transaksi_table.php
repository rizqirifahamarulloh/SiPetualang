<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('status_kembali')->default('belum'); // 'belum', 'proses', 'diterima'
            $table->string('metode_kembali')->nullable(); // 'pickup', 'delivery'
            $table->string('no_resi_kembali')->nullable();
        });
    }

    public function down()
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn(['status_kembali', 'metode_kembali', 'no_resi_kembali']);
        });
    }
};
