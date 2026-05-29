<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('detail_transaksi', function (Blueprint $table) {
            // Drop existing foreign key first
            $table->dropForeign(['id_barang']);
            // Make column nullable
            $table->unsignedBigInteger('id_barang')->nullable()->change();
            // Re-add foreign key with SET NULL on delete
            $table->foreign('id_barang')->references('id_barang')->on('barang')->onDelete('set null');
        });

        // Also update transaksi table foreign key to SET NULL on delete
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropForeign(['id_barang']);
            $table->foreign('id_barang')->references('id_barang')->on('barang')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->dropForeign(['id_barang']);
            $table->unsignedBigInteger('id_barang')->nullable(false)->change();
            $table->foreign('id_barang')->references('id_barang')->on('barang');
        });

        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropForeign(['id_barang']);
            $table->foreign('id_barang')->references('id_barang')->on('barang');
        });
    }
};
