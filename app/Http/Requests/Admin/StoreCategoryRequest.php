<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('admin') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('parent_id') === '') {
            $this->merge(['parent_id' => null]);
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
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Keep the tree at two levels: a parent must itself be a root category.
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $parentId = $this->input('parent_id');

                if ($parentId !== null && Category::whereKey($parentId)->value('parent_id') !== null) {
                    $validator->errors()->add('parent_id', 'Kategori induk harus kategori tingkat atas.');
                }
            },
        ];
    }
}
