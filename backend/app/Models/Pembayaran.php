<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';
    protected $fillable = [
        'id_transaksi', 'metode_bayar', 'status_bayar', 'bukti_bayar', 'tanggal_bayar'
    ];
}
