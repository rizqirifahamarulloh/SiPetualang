<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->string('deposit_status')->default('none')->after('no_resi_kembali')
                  ->comment('none, pending, refunded, partial_refund, forfeited');
            $table->decimal('deposit_refund_amount', 15, 2)->nullable()->after('deposit_status');
            $table->string('deposit_refund_method')->nullable()->after('deposit_refund_amount');
            $table->text('deposit_refund_note')->nullable()->after('deposit_refund_method');
            $table->timestamp('deposit_refunded_at')->nullable()->after('deposit_refund_note');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi', function (Blueprint $table) {
            $table->dropColumn([
                'deposit_status',
                'deposit_refund_amount',
                'deposit_refund_method',
                'deposit_refund_note',
                'deposit_refunded_at',
            ]);
        });
    }
};
