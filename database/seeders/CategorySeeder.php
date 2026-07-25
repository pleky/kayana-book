<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Flat genre list for MVP (2-level nesting deferred to Fase 4).
     *
     * @var list<string>
     */
    private const CATEGORIES = [
        // Fiksi
        'Novel',
        'Sastra',
        'Fantasi & Sci-Fi',
        'Misteri & Thriller',
        'Komik & Manga',
        // Non-Fiksi
        'Biografi',
        'Sejarah',
        'Pengembangan Diri',
        'Bisnis & Ekonomi',
        'Agama & Religi',
        'Sains & Teknologi',
        'Psikologi & Filsafat',
        // Pendidikan
        'Buku Pelajaran & Kuliah',
        'Kamus & Bahasa',
        // Anak
        'Buku Anak',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::CATEGORIES as $index => $name) {
            Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $index],
            );
        }
    }
}
