<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom nominal_deposit ke tabel barang
     * dan kolom denda_kerusakan ke tabel pengembalian.
     */
    public function up(): void
    {
        // Tambah kolom nominal_deposit ke tabel barang
        Schema::table('barang', function (Blueprint $table) {
            $table->decimal('nominal_deposit', 12, 2)->default(0)->after('harga_sewa');
        });

        // Tambah kolom denda_kerusakan ke tabel pengembalian
        Schema::table('pengembalian', function (Blueprint $table) {
            $table->decimal('denda_kerusakan', 12, 2)->default(0)->after('total_denda');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barang', function (Blueprint $table) {
            $table->dropColumn('nominal_deposit');
        });

        Schema::table('pengembalian', function (Blueprint $table) {
            $table->dropColumn('denda_kerusakan');
        });
    }
};
