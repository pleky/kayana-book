<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookSeeder extends Seeder
{
    /**
     * Curated dummy catalogue. Each row:
     * [title, author, category-slug, language, audience, [tags...]].
     *
     * @var list<array{0:string,1:string,2:string,3:string,4:string,5:list<string>}>
     */
    private const BOOKS = [
        ['Laskar Pelangi', 'Andrea Hirata', 'novel', 'id', 'umum', ['Best Seller']],
        ['Bumi Manusia', 'Pramoedya Ananta Toer', 'sastra', 'id', 'dewasa', ['Langka', 'Sastra Klasik']],
        ['Cantik Itu Luka', 'Eka Kurniawan', 'sastra', 'id', 'dewasa', ['Sastra Klasik']],
        ['Pulang', 'Leila S. Chudori', 'novel', 'id', 'dewasa', []],
        ['Laut Bercerita', 'Leila S. Chudori', 'novel', 'id', 'dewasa', ['Best Seller']],
        ['Negeri 5 Menara', 'Ahmad Fuadi', 'novel', 'id', 'remaja', []],
        ['Perahu Kertas', 'Dee Lestari', 'novel', 'id', 'remaja', []],
        ['Supernova: Ksatria, Puteri, dan Bintang Jatuh', 'Dee Lestari', 'fantasi-sci-fi', 'id', 'dewasa', []],
        ['Filosofi Kopi', 'Dee Lestari', 'sastra', 'id', 'umum', []],
        ['Gadis Kretek', 'Ratih Kumala', 'sastra', 'id', 'dewasa', []],
        ['Harry Potter dan Batu Bertuah', 'J.K. Rowling', 'fantasi-sci-fi', 'id', 'remaja', ['Best Seller']],
        ['The Hobbit', 'J.R.R. Tolkien', 'fantasi-sci-fi', 'en', 'remaja', []],
        ['The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', 'misteri-thriller', 'en', 'umum', ['Klasik']],
        ['One Piece Vol. 1', 'Eiichiro Oda', 'komik-manga', 'id', 'remaja', ['Manga']],
        ['Doraemon Vol. 5', 'Fujiko F. Fujio', 'komik-manga', 'id', 'anak', ['Manga']],
        ['Atomic Habits', 'James Clear', 'pengembangan-diri', 'id', 'umum', ['Best Seller']],
        ['Berani Tidak Disukai', 'Ichiro Kishimi & Fumitake Koga', 'pengembangan-diri', 'id', 'umum', []],
        ['Filosofi Teras', 'Henry Manampiring', 'psikologi-filsafat', 'id', 'umum', ['Best Seller']],
        ['Thinking, Fast and Slow', 'Daniel Kahneman', 'psikologi-filsafat', 'en', 'dewasa', []],
        ['Sapiens: Riwayat Singkat Umat Manusia', 'Yuval Noah Harari', 'sejarah', 'id', 'dewasa', ['Best Seller']],
        ['Homo Deus', 'Yuval Noah Harari', 'sains-teknologi', 'id', 'dewasa', []],
        ['Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'bisnis-ekonomi', 'id', 'umum', []],
        ['Steve Jobs', 'Walter Isaacson', 'biografi', 'id', 'dewasa', []],
        ['Catatan Seorang Demonstran', 'Soe Hok Gie', 'biografi', 'id', 'dewasa', ['Langka']],
        ['Sejarah Tuhan', 'Karen Armstrong', 'agama-religi', 'id', 'dewasa', []],
        ['Muhammad: Kisah Hidup Sang Nabi', 'Karen Armstrong', 'agama-religi', 'id', 'umum', []],
        ['Kamus Besar Bahasa Indonesia', 'Tim Penyusun', 'kamus-bahasa', 'id', 'umum', []],
        ['Kalkulus Jilid 1', 'Edwin J. Purcell', 'buku-pelajaran-kuliah', 'id', 'umum', ['Bekas Kuliah']],
        ['Si Kancil dan Buaya', 'Tim Dongeng', 'buku-anak', 'id', 'anak', []],
        ['Dongeng Nusantara Pilihan', 'Tim Dongeng', 'buku-anak', 'id', 'anak', []],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoryIds = Category::pluck('id', 'slug');
        $covers = $this->coverPool();
        $coverCount = count($covers);

        foreach (self::BOOKS as $index => [$title, $author, $categorySlug, $language, $audience, $tags]) {
            // Idempotent by title; skip if this dummy book is already present.
            if (Book::where('title', $title)->exists()) {
                continue;
            }

            $price = fake()->numberBetween(30, 280) * 500;

            $book = Book::create([
                'title' => $title,
                'slug' => $this->uniqueSlug($title),
                'author' => $author,
                'isbn' => fake()->optional()->isbn13(),
                'description' => fake()->optional(0.7)->paragraph(),
                'condition' => fake()->randomElement(['new', 'like_new', 'good', 'good', 'fair']),
                'is_new' => fake()->boolean(15),
                'price' => $price,
                'cost_price' => (int) round($price * 0.6),
                'status' => 'available',
                'category_id' => $categoryIds[$categorySlug] ?? null,
                'language' => $language,
                'audience' => $audience,
            ]);

            if ($tags !== []) {
                $book->tags()->sync(Tag::fromNames($tags)->pluck('id'));
            }

            if ($coverCount > 0) {
                $book->images()->create([
                    'path' => $covers[$index % $coverCount],
                    'is_primary' => true,
                    'sort_order' => 1,
                ]);
            }
        }
    }

    /**
     * Build a slug unique across live and soft-deleted books.
     */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'buku';
        $slug = $base;
        $suffix = 1;

        while (Book::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-".++$suffix;
        }

        return $slug;
    }

    /**
     * Collect usable cover image paths (relative to the public disk). Falls
     * back to generated placeholder covers when no uploads exist yet, so the
     * catalogue still shows images on a fresh machine.
     *
     * @return list<string>
     */
    private function coverPool(): array
    {
        $disk = Storage::disk('public');

        $existing = array_values(array_filter(
            $disk->files('books'),
            fn (string $path): bool => (bool) preg_match('/\.(jpe?g|png|webp)$/i', $path),
        ));

        if ($existing !== []) {
            return $existing;
        }

        return $this->generatePlaceholderCovers();
    }

    /**
     * Generate a handful of solid-colour placeholder covers via GD.
     *
     * @return list<string>
     */
    private function generatePlaceholderCovers(): array
    {
        if (! function_exists('imagecreatetruecolor')) {
            return [];
        }

        $disk = Storage::disk('public');
        $palette = [[181, 83, 42], [120, 90, 60], [80, 70, 90], [60, 90, 80], [150, 110, 50]];
        $paths = [];

        foreach ($palette as $i => [$r, $g, $b]) {
            $image = imagecreatetruecolor(600, 800);
            imagefill($image, 0, 0, imagecolorallocate($image, $r, $g, $b));
            imagefilledrectangle($image, 40, 40, 560, 760, imagecolorallocate($image, (int) ($r * 0.85), (int) ($g * 0.85), (int) ($b * 0.85)));

            ob_start();
            imagepng($image);
            $contents = (string) ob_get_clean();
            imagedestroy($image);

            $path = "books/seed/cover-{$i}.png";
            $disk->put($path, $contents);
            $paths[] = $path;
        }

        return $paths;
    }
}
