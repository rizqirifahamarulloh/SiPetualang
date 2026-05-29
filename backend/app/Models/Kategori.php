<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kategori extends Model
{
    protected $table = 'kategori';
    protected $primaryKey = 'id_kategori';

    // ✅ TAMBAHKAN INI
    public $timestamps = false;

    protected $fillable = ['nama_kategori'];

    public function barang() {
        return $this->hasMany(Barang::class, 'id_kategori', 'id_kategori');
    }
}
