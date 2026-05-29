<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('pengguna', function (Blueprint $table) {
            $table->id('id_pengguna');
            $table->string('nama', 100);
            $table->string('email', 100)->unique();
            $table->text('alamat')->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('password', 255);
            $table->string('no_telp', 15)->nullable();
            $table->enum('peran_pengguna', ['customer', 'admin', 'perental'])->default('customer');
            $table->enum('rental', ['false', 'true'])->default('false');
        });
    }

    public function down()
    {
        Schema::dropIfExists('pengguna');
    }
};
