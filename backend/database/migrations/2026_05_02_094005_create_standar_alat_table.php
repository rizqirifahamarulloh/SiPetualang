<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('standar_alat', function (Blueprint $table) {
            $table->id('id_standar');
            $table->unsignedBigInteger('id_destinasi');
            $table->unsignedBigInteger('id_kategori');

            $table->foreign('id_destinasi')->references('id_destinasi')->on('jenis_destinasi');
            $table->foreign('id_kategori')->references('id_kategori')->on('kategori');
        });
    }

    public function down()
    {
        Schema::dropIfExists('standar_alat');
    }
};
