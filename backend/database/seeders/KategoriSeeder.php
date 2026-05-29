<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kategori;

class KategoriSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            'Camping',
            'Hiking',
            'Climbing',
            'Cooking Gear',
            'Sleeping Bag & Matras',
            'Aksesoris & Penerangan',
        ];

        foreach ($categories as $category) {
            Kategori::updateOrCreate(
                ['nama_kategori' => $category],
                ['nama_kategori' => $category]
            );
        }
    }
}
