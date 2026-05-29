<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('verifikasi', function (Blueprint $table) {
            $table->id('id_verifikasi');
            $table->unsignedBigInteger('id_pengguna');
            $table->string('foto_ktp');
            $table->string('foto_selfie_ktp');
            $table->enum('status_verifikasi', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->timestamp('tanggal_pengajuan')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->text('catatan_admin')->nullable();

            $table->foreign('id_pengguna')->references('id_pengguna')->on('pengguna')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('verifikasi');
    }
};
