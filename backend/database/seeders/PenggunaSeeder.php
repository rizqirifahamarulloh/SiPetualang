<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pengguna;
use Illuminate\Support\Facades\Hash;

class PenggunaSeeder extends Seeder
{
    public function run()
    {
        // Admin
        Pengguna::updateOrCreate(
            ['email' => 'admin@sipetualang.com'],
            [
                'nama' => 'Admin SiPetualang',
                'email' => 'admin@sipetualang.com',
                'alamat' => 'Jl. Admin No. 1',
                'kota' => 'Jakarta',
                'password' => Hash::make('password'),
                'no_telp' => '081234567890',
                'peran_pengguna' => 'admin',
            ]
        );

        // Test Customer
        Pengguna::updateOrCreate(
            ['email' => 'penyewa@test.com'],
            [
                'nama' => 'Budi Penyewa',
                'email' => 'penyewa@test.com',
                'alamat' => 'Jl. Penyewa No. 2',
                'kota' => 'Bandung',
                'password' => Hash::make('password'),
                'no_telp' => '081234567891',
                'peran_pengguna' => 'customer',
            ]
        );

          Pengguna::updateOrCreate(
            ['email' => 'perental@test.com'],
            [
                'nama' => 'Budi Perental',
                'email' => 'perental@test.com',
                'alamat' => 'Jl. Perental No. 1',
                'kota' => 'Jakarta',
                'password' => Hash::make('password'),
                'no_telp' => '081234567891',
                'peran_pengguna' => 'perental',
                'rental' => 'true',
            ]
        );
    }
}
