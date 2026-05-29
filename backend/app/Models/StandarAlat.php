<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StandarAlat extends Model
{
    protected $table = 'standar_alat';
    protected $primaryKey = 'id_standar';
    protected $fillable = ['id_destinasi', 'id_kategori'];

    public function kategori() {
        return $this->belongsTo(Kategori::class, 'id_kategori', 'id_kategori');
    }

    public function jenisDestinasi() {
        return $this->belongsTo(JenisDestinasi::class, 'id_destinasi', 'id_destinasi');
    }
}
