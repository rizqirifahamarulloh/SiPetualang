<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up()
  {
    Schema::create('notifikasi', function (Blueprint $table) {
      $table->id('id_notifikasi');
      $table->unsignedBigInteger('id_pengguna');
      $table->string('unique_key')->nullable();
      $table->string('type', 50);
      $table->string('title', 255);
      $table->text('message');
      $table->string('severity', 20)->default('info');
      $table->json('data')->nullable();
      $table->boolean('is_read')->default(false);
      $table->timestamps();

      $table->foreign('id_pengguna')->references('id_pengguna')->on('pengguna')->onDelete('cascade');
      $table->unique(['id_pengguna', 'unique_key']);
    });
  }

  public function down()
  {
    Schema::dropIfExists('notifikasi');
  }
};
