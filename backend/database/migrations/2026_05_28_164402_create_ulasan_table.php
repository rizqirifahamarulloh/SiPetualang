<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ulasan', function (Blueprint $table) {
            $table->id('id_ulasan');
            $table->unsignedBigInteger('id_transaksi');
            $table->unsignedBigInteger('id_pengguna');
            $table->unsignedBigInteger('id_barang');
            $table->tinyInteger('rating')->comment('1-5');
            $table->text('komentar')->nullable();
            $table->text('foto_ulasan')->nullable(); // JSON array of paths
            $table->timestamps();

            $table->unique('id_transaksi'); // 1 transaksi = 1 ulasan
            $table->index('id_barang');
            $table->index('id_pengguna');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ulasan');
    }
};
