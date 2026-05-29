<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisDestinasi extends Model
{
    protected $table = 'jenis_destinasi';
    protected $primaryKey = 'id_destinasi';
    protected $fillable = ['nama_destinasi'];
    public $timestamps = false;

    public function standarAlat()
    {
        return $this->hasMany(StandarAlat::class, 'id_destinasi', 'id_destinasi');
    }
}
