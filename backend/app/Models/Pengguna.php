<?php

namespace App\Models;

use App\Models\Verifikasi;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Pengguna extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'pengguna';
    protected $primaryKey = 'id_pengguna';
    public $timestamps = false;

    protected $appends = ['is_verified', 'verification_status', 'verification_note'];

    protected $fillable = [
        'nama',
        'email',
        'alamat',
        'kota',
        'password',
        'no_telp',
        'peran_pengguna',
        'google_id',
        'profile_photo',
        'rental',
        'tanggal_lahir',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    public function verifikasi()
    {
        return $this->hasMany(Verifikasi::class, 'id_pengguna', 'id_pengguna')->orderBy('id_verifikasi', 'desc');
    }



    public function getIsVerifiedAttribute()
    {
        return $this->verifikasi()->where('status_verifikasi', 'disetujui')->exists();
    }

    public function getVerificationStatusAttribute()
    {
        $latest = $this->verifikasi()->first();
        return $latest ? $latest->status_verifikasi : null;
    }

    public function getVerificationNoteAttribute()
    {
        $latest = $this->verifikasi()->first();
        return $latest ? $latest->catatan_admin : null;
    }



    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'id_pengguna' => $this->id_pengguna,
            'nama' => $this->nama,
            'email' => $this->email,
            'peran' => $this->peran_pengguna,
            'rental' => $this->rental,
            'tanggal_lahir' => $this->tanggal_lahir,
            'verification_status' => $this->verification_status,
            'verification_note' => $this->verification_note,
        ];
    }

    // Role check methods
    public function isCustomer()
    {
        return $this->peran_pengguna === 'customer';
    }

    public function isAdmin()
    {
        return $this->peran_pengguna === 'admin';
    }

    public function isPerental()
    {
        return $this->peran_pengguna === 'perental';
    }
    public function barang()
{
    return $this->hasMany(Barang::class, 'id_pemilik', 'id_pengguna');
}
}
