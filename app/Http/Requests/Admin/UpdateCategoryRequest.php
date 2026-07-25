<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
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
     * Guard the two-level invariant: a category cannot be its own parent, the
     * parent must be a root, and a category that already has children cannot
     * itself become a child.
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $parentId = $this->input('parent_id');

                if ($parentId === null) {
                    return;
                }

                /** @var Category $category */
                $category = $this->route('category');

                if ((int) $parentId === $category->id) {
                    $validator->errors()->add('parent_id', 'Kategori tidak bisa menjadi induk dirinya sendiri.');

                    return;
                }

                if (Category::whereKey($parentId)->value('parent_id') !== null) {
                    $validator->errors()->add('parent_id', 'Kategori induk harus kategori tingkat atas.');
                }

                if ($category->children()->exists()) {
                    $validator->errors()->add('parent_id', 'Kategori ini punya sub-kategori, tidak bisa dijadikan sub-kategori.');
                }
            },
        ];
    }
}
