<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->unsignedBigInteger('id_penyewa');
            $table->unsignedBigInteger('id_pemilik');
            $table->unsignedBigInteger('id_barang');
            $table->string('nama_barang');
            $table->integer('jumlah');
            $table->decimal('harga_per_hari', 12, 2);
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->integer('total_hari');
            $table->decimal('total_biaya', 12, 2);
            $table->decimal('nominal_deposit', 12, 2)->nullable();
            $table->decimal('fee_admin', 12, 2)->default(0);
            $table->decimal('pendapatan_pemilik', 12, 2)->default(0);
            $table->enum('metode_pengiriman', ['pickup', 'delivery'])->default('pickup');
            $table->text('alamat_pengiriman')->nullable();
            $table->decimal('biaya_pengiriman', 12, 2)->default(0);
            $table->enum('status_sewa', ['menunggu_pembayaran', 'dibayar', 'sedang_disewa', 'selesai', 'dibatalkan'])->default('menunggu_pembayaran');
            $table->enum('status_pembayaran', ['pending', 'sukses', 'gagal'])->default('pending');
            $table->date('tanggal_kembali_real')->nullable();
            $table->string('midtrans_order_id')->nullable();
            $table->string('snap_token')->nullable();
            $table->timestamps();

            $table->foreign('id_penyewa')->references('id_pengguna')->on('pengguna');
            $table->foreign('id_pemilik')->references('id_pengguna')->on('pengguna');
            $table->foreign('id_barang')->references('id_barang')->on('barang');
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaksi');
    }
};
