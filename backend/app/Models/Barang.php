<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\DetailTransaksi;

class Barang extends Model
{
    protected $table = 'barang';
    protected $primaryKey = 'id_barang';

    // Matikan timestamps karena tabel tidak punya
    public $timestamps = false;

    protected $fillable = [
        'id_pemilik',
        'id_kategori',
        'nama_barang',
        'deskripsi',
        'foto_barang',
        'harga_sewa',
        'min_durasi_sewa',
        'nominal_deposit',
        'jumlah_stok',
        'status_barang',
        'status_approval',
        'butuh_verifikasi',
        'metode_penyerahan',
        'no_resi_penyerahan',
        'status_penyerahan'
    ];

    public function pemilik()
    {
        return $this->belongsTo(Pengguna::class, 'id_pemilik', 'id_pengguna');
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'id_kategori', 'id_kategori');
    }

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksi::class, 'id_barang', 'id_barang');
    }
}
