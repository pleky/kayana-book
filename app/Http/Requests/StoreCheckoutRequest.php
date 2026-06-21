<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'fulfillment' => ['required', Rule::in(['pickup', 'ship'])],
            'user_address_id' => [
                'nullable',
                'required_if:fulfillment,ship',
                Rule::exists('user_addresses', 'id')->where('user_id', $this->user()?->id),
            ],
            // The picked quote. Cost is re-quoted server-side, never trusted.
            'shipping_courier' => ['nullable', 'string', 'max:30'],
            'shipping_service' => ['nullable', 'string', 'max:60', 'required_with:shipping_courier'],
        ];
    }
}
