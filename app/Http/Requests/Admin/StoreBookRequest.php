<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('admin') ?? false;
    }

    /**
     * Normalize empty optional inputs to null before validation.
     */
    protected function prepareForValidation(): void
    {
        foreach (['author', 'isbn', 'description', 'cost_price', 'category_id', 'weight_grams'] as $field) {
            if ($this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['nullable', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'condition' => ['required', Rule::in(['like_new', 'good', 'fair', 'poor'])],
            'is_new' => ['boolean'],
            'price' => ['required', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'integer', 'min:0'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'language' => ['required', Rule::in(['id', 'en', 'lainnya'])],
            'audience' => ['required', Rule::in(['anak', 'remaja', 'dewasa', 'umum'])],
            'tags' => ['nullable', 'string', 'max:500'],
            'weight_grams' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'photos' => ['required', 'array', 'min:1', 'max:8'],
            'photos.*' => ['image', 'max:5120'],
        ];
    }
}
