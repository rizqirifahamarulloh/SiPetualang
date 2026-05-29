<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            $table->string('nama_bank', 100)->nullable()->after('alamat_pengembalian');
            $table->string('no_rekening', 50)->nullable()->after('nama_bank');
            $table->string('atas_nama_rekening', 150)->nullable()->after('no_rekening');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_pengembalian', function (Blueprint $table) {
            $table->dropColumn(['nama_bank', 'no_rekening', 'atas_nama_rekening']);
        });
    }
};
