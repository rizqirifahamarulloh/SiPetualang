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
        Schema::table('barang', function (Blueprint $table) {
            $table->string('metode_penyerahan', 50)->default('pickup')->after('status_approval');
            $table->string('no_resi_penyerahan', 100)->nullable()->after('metode_penyerahan');
            $table->string('status_penyerahan', 50)->default('belum_dikirim')->after('no_resi_penyerahan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barang', function (Blueprint $table) {
            $table->dropColumn(['metode_penyerahan', 'no_resi_penyerahan', 'status_penyerahan']);
        });
    }
};
