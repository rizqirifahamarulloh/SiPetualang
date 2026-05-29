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
        Schema::create('pengembalian', function (Blueprint $table) {
            $table->id('id_pengembalian');
            $table->unsignedBigInteger('id_transaksi');
            $table->date('tanggal_kembali');
            $table->integer('jumlah_kembali');
            $table->decimal('denda_per_hari', 12, 2)->default(20000);
            $table->decimal('total_denda', 12, 2)->default(0);
            $table->enum('status_pengembalian', ['tepat_waktu', 'terlambat'])->default('tepat_waktu');
            $table->string('kondisi_barang')->default('baik');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('id_transaksi')->references('id_transaksi')->on('transaksi')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengembalian');
    }
};
