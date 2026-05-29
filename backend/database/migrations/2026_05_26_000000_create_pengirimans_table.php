<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pengiriman', function (Blueprint $table) {
            $table->id('id_pengiriman');
            $table->unsignedBigInteger('id_transaksi');
            $table->enum('status_pengiriman', ['pending', 'dikirim', 'sampai', 'diterima'])->default('pending');
            $table->string('lokasi_terakhir')->default('Gudang Penyedia');
            $table->string('no_resi')->nullable();
            $table->string('kurir')->nullable();
            $table->timestamps();

            $table->foreign('id_transaksi')->references('id_transaksi')->on('transaksi')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('pengiriman');
    }
};
