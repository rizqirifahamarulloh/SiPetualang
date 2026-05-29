<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Verifikasi extends Model
{
    protected $table = 'verifikasi';

    protected $primaryKey = 'id_verifikasi';

    public $timestamps = false; // karena kamu pakai tanggal_pengajuan manual

    protected $fillable = [
        'id_pengguna',
        'foto_ktp',
        'foto_selfie_ktp',
        'status_verifikasi',
        'catatan_admin',
        'tanggal_pengajuan'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELASI
    |--------------------------------------------------------------------------
    */

    public function pengguna()
    {
        return $this->belongsTo(Pengguna::class, 'id_pengguna');
    }
}
