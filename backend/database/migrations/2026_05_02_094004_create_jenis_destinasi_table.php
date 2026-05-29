<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('jenis_destinasi', function (Blueprint $table) {
            $table->id('id_destinasi');
            $table->string('nama_destinasi', 50);
        });
    }

    public function down()
    {
        Schema::dropIfExists('jenis_destinasi');
    }
};
