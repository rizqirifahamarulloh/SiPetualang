<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop the empty stub table first
        Schema::dropIfExists('pengajuan_pengembalian');

        Schema::create('pengajuan_pengembalian', function (Blueprint $table) {
            $table->id('id_pengajuan');
            $table->unsignedBigInteger('id_transaksi');
            $table->unsignedBigInteger('id_customer');
            $table->text('alasan');
            $table->json('foto_bukti'); // array of file paths
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->text('catatan_admin')->nullable();
            $table->timestamps();

            $table->foreign('id_transaksi')->references('id_transaksi')->on('transaksi')->onDelete('cascade');
            $table->foreign('id_customer')->references('id_pengguna')->on('pengguna')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_pengembalian');
    }
};
