<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add extra columns to detail_transaksi for multi-item support
        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->string('nama_barang')->nullable()->after('id_barang');
            $table->decimal('harga_per_hari', 12, 2)->nullable()->after('nama_barang');
            $table->decimal('nominal_deposit', 12, 2)->default(0)->after('subtotal');
            $table->unsignedBigInteger('id_pemilik')->nullable()->after('nominal_deposit');
        });

        // Make single-item columns nullable on transaksi (for multi-item support)
        Schema::table('transaksi', function (Blueprint $table) {
            $table->unsignedBigInteger('id_pemilik')->nullable()->change();
            $table->unsignedBigInteger('id_barang')->nullable()->change();
            $table->string('nama_barang')->nullable()->change();
            $table->integer('jumlah')->nullable()->change();
            $table->decimal('harga_per_hari', 12, 2)->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('detail_transaksi', function (Blueprint $table) {
            $table->dropColumn(['nama_barang', 'harga_per_hari', 'nominal_deposit', 'id_pemilik']);
        });

        Schema::table('transaksi', function (Blueprint $table) {
            $table->unsignedBigInteger('id_pemilik')->nullable(false)->change();
            $table->unsignedBigInteger('id_barang')->nullable(false)->change();
            $table->string('nama_barang')->nullable(false)->change();
            $table->integer('jumlah')->nullable(false)->change();
            $table->decimal('harga_per_hari', 12, 2)->nullable(false)->change();
        });
    }
};
