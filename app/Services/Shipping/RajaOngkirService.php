<?php

namespace App\Services\Shipping;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Thin client for the RajaOngkir Komerce V2 API (PRD-SHIPPING.md §4). Every
 * call is cached aggressively and gated by a daily circuit breaker because the
 * account quota is only 100 hits/day (§6.5). All methods degrade gracefully:
 * searches return [] and cost quotes return null when the API is unavailable.
 */
class RajaOngkirService
{
    public function hasKey(): bool
    {
        return filled(config('services.rajaongkir.key'));
    }

    public function configured(): bool
    {
        return $this->hasKey() && filled(config('services.rajaongkir.origin_id'));
    }

    /**
     * Autocomplete subdistrict destinations by free-text query.
     *
     * @return list<array{id: int, label: string}>
     */
    public function searchDestinations(string $query): array
    {
        $normalized = trim(mb_strtolower($query));

        if (mb_strlen($normalized) < 3 || ! $this->hasKey()) {
            return [];
        }

        $key = 'ro:search:'.md5($normalized);

        /** @var list<array{id: int, label: string}>|null $cached */
        $cached = Cache::get($key);

        if ($cached !== null) {
            return $cached;
        }

        if (! $this->withinDailyBudget()) {
            return [];
        }

        try {
            $response = $this->http()->get('/destination/domestic-destination', [
                'search' => $normalized,
                'limit' => 10,
                'offset' => 0,
            ]);
        } catch (\Throwable) {
            return [];
        }

        if ($response->failed()) {
            return [];
        }

        $this->recordHit();

        /** @var list<array{id: int, label: string}> $results */
        $results = collect((array) $response->json('data', []))
            ->map(fn (array $row): array => [
                'id' => (int) $row['id'],
                'label' => (string) $row['label'],
            ])
            ->values()
            ->all();

        Cache::put($key, $results, now()->addDays((int) config('services.rajaongkir.search_cache_days')));

        return $results;
    }

    /**
     * Quote shipping cost for every configured courier in one call. Returns
     * null when shipping cannot be quoted (not configured, budget exhausted,
     * or the API failed) — the caller falls back to a manual cost.
     *
     * @return list<array{courier: string, courier_name: string, service: string, description: string, cost: int, etd: string}>|null
     */
    public function calculateCost(int $destination, int $weightGrams): ?array
    {
        if (! $this->configured() || $destination <= 0) {
            return null;
        }

        $origin = (int) config('services.rajaongkir.origin_id');
        $weight = $this->bucketWeight($weightGrams);
        /** @var list<string> $couriers */
        $couriers = config('services.rajaongkir.couriers');

        $key = "ro:cost:{$origin}:{$destination}:{$weight}:".implode('-', $couriers);

        /** @var list<array{courier: string, courier_name: string, service: string, description: string, cost: int, etd: string}>|null $cached */
        $cached = Cache::get($key);

        if ($cached !== null) {
            return $cached;
        }

        if (! $this->withinDailyBudget()) {
            return null;
        }

        try {
            $response = $this->http()->asForm()->post('/calculate/domestic-cost', [
                'origin' => $origin,
                'destination' => $destination,
                'weight' => $weight,
                'courier' => implode(':', $couriers),
            ]);
        } catch (\Throwable) {
            return null;
        }

        if ($response->failed()) {
            return null;
        }

        $this->recordHit();

        /** @var list<array{courier: string, courier_name: string, service: string, description: string, cost: int, etd: string}> $options */
        $options = collect((array) $response->json('data', []))
            ->map(fn (array $row): array => [
                'courier' => (string) $row['code'],
                'courier_name' => (string) $row['name'],
                'service' => (string) $row['service'],
                'description' => (string) ($row['description'] ?? ''),
                'cost' => (int) $row['cost'],
                'etd' => (string) ($row['etd'] ?? ''),
            ])
            ->values()
            ->all();

        Cache::put($key, $options, now()->addDays((int) config('services.rajaongkir.cost_cache_days')));

        return $options;
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl((string) config('services.rajaongkir.base_url'))
            ->timeout((int) config('services.rajaongkir.timeout'))
            ->withHeaders(['key' => (string) config('services.rajaongkir.key')])
            ->acceptJson();
    }

    /**
     * Round weight up to the next kilogram (min 1 kg) — couriers bill per kg,
     * and bucketing lets many orders share one cache entry (§6.5b).
     */
    private function bucketWeight(int $grams): int
    {
        return (int) max(1000, ceil(max($grams, 1) / 1000) * 1000);
    }

    private function dailyKey(): string
    {
        return 'ro:calls:'.now()->format('Ymd');
    }

    private function withinDailyBudget(): bool
    {
        return (int) Cache::get($this->dailyKey(), 0) < (int) config('services.rajaongkir.daily_limit');
    }

    private function recordHit(): void
    {
        $key = $this->dailyKey();
        Cache::add($key, 0, now()->endOfDay());
        Cache::increment($key);
    }
}
