<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreAddressRequest;
use App\Http\Requests\Settings\UpdateAddressRequest;
use App\Models\UserAddress;
use App\Services\Shipping\RajaOngkirService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    /**
     * Show the user's saved addresses.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/addresses', [
            'addresses' => $request->user()->addresses()
                ->orderByDesc('is_default')
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Autocomplete RajaOngkir destinations for the address form.
     */
    public function search(Request $request, RajaOngkirService $shipping): JsonResponse
    {
        return response()->json([
            'data' => $shipping->searchDestinations((string) $request->query('q', '')),
        ]);
    }

    /**
     * Store a new address. The first address (or one flagged default) becomes
     * the user's default.
     */
    public function store(StoreAddressRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $makeDefault = ($data['is_default'] ?? false) || $user->addresses()->count() === 0;

        DB::transaction(function () use ($user, $data, $makeDefault): void {
            $address = $user->addresses()->create([
                ...$data,
                'is_default' => $makeDefault,
            ]);

            if ($makeDefault) {
                $this->promoteDefault($address);
            }
        });

        if ($request->input('redirect_to') === 'checkout') {
            return to_route('checkout.create')->with('success', 'Alamat disimpan.');
        }

        return to_route('addresses.edit')->with('success', 'Alamat disimpan.');
    }

    public function update(UpdateAddressRequest $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        $data = $request->validated();
        $makeDefault = ($data['is_default'] ?? false) || $address->is_default;

        DB::transaction(function () use ($address, $data, $makeDefault): void {
            $address->update([...$data, 'is_default' => $makeDefault]);

            if ($makeDefault) {
                $this->promoteDefault($address);
            }
        });

        return to_route('addresses.edit')->with('success', 'Alamat diperbarui.');
    }

    public function setDefault(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        DB::transaction(function () use ($address): void {
            $address->update(['is_default' => true]);
            $this->promoteDefault($address);
        });

        return to_route('addresses.edit')->with('success', 'Alamat utama diperbarui.');
    }

    public function destroy(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwner($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        // Promote the next address to default so the user always has one.
        if ($wasDefault) {
            $next = $request->user()->addresses()->latest()->first();
            $next?->update(['is_default' => true]);
        }

        return to_route('addresses.edit')->with('success', 'Alamat dihapus.');
    }

    /**
     * Clear the default flag on the user's other addresses.
     */
    private function promoteDefault(UserAddress $address): void
    {
        $address->user->addresses()
            ->whereKeyNot($address->getKey())
            ->update(['is_default' => false]);
    }

    private function authorizeOwner(Request $request, UserAddress $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }
}
