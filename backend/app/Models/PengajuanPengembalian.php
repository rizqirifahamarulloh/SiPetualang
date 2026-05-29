<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengajuanPengembalian extends Model
{
    protected $table = 'pengajuan_pengembalian';
    protected $primaryKey = 'id_pengajuan';

    protected $fillable = [
        'id_transaksi',
        'id_customer',
        'alasan',
        'foto_bukti',
        'metode_pengembalian',
        'alamat_pengembalian',
        'nama_bank',
        'no_rekening',
        'atas_nama_rekening',
        'biaya_ongkir_pengembalian',
        'sisa_hari_sewa',
        'refund_sewa',
        'refund_deposit',
        'potongan_admin_fee',
        'status',
        'catatan_admin',
        'jumlah_refund',
        'status_refund',
        'metode_refund',
        'bukti_refund',
        'tanggal_refund',
    ];

    protected $casts = [
        'foto_bukti' => 'array',
        'jumlah_refund' => 'decimal:2',
        'refund_sewa' => 'decimal:2',
        'refund_deposit' => 'decimal:2',
        'potongan_admin_fee' => 'decimal:2',
        'biaya_ongkir_pengembalian' => 'decimal:2',
        'tanggal_refund' => 'datetime',
    ];

    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }

    public function customer()
    {
        return $this->belongsTo(Pengguna::class, 'id_customer', 'id_pengguna');
    }
}

