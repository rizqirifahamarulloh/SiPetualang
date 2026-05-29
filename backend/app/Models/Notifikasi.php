<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notifikasi extends Model
{
  protected $table = 'notifikasi';
  protected $primaryKey = 'id_notifikasi';
  protected $fillable = [
    'id_pengguna',
    'unique_key',
    'type',
    'title',
    'message',
    'severity',
    'data',
    'is_read',
    'is_dismissed',
  ];

  protected $casts = [
    'data' => 'array',
    'is_read' => 'boolean',
    'is_dismissed' => 'boolean',
  ];

  public function pengguna()
  {
    return $this->belongsTo(Pengguna::class, 'id_pengguna', 'id_pengguna');
  }
}
