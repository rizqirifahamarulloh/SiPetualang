<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JenisDestinasi;

class JenisDestinasiSeeder extends Seeder
{
    public function run()
    {
        $destinations = [
            'Gunung Rinjani',
            'Gunung Semeru',
            'Gunung Gede Pangrango',
            'Gunung Merbabu',
            'Gunung Prau',
            'Pantai Carita',
        ];

        foreach ($destinations as $dest) {
            JenisDestinasi::updateOrCreate(
                ['nama_destinasi' => $dest],
                ['nama_destinasi' => $dest]
            );
        }
    }
}
