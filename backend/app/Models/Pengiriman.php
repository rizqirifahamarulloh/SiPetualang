<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengiriman extends Model
{
    protected $table = 'pengiriman';
    protected $primaryKey = 'id_pengiriman';
    public $timestamps = true;

    protected $fillable = [
        'id_transaksi',
        'status_pengiriman',
        'lokasi_terakhir',
        'no_resi',
        'kurir',
    ];

    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
