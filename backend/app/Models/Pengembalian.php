<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengembalian extends Model
{
    protected $table = 'pengembalian';
    protected $primaryKey = 'id_pengembalian';
    public $timestamps = true;

    protected $fillable = [
        'id_transaksi',
        'tanggal_kembali',
        'jumlah_kembali',
        'denda_per_hari',
        'total_denda',
        'denda_kerusakan',
        'status_pengembalian',
        'kondisi_barang',
        'catatan'
    ];

    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
