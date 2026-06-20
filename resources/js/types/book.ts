export type BookCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type BookStatus = 'available' | 'reserved' | 'sold';
export type BookLanguage = 'id' | 'en' | 'lainnya';
export type BookAudience = 'anak' | 'remaja' | 'dewasa' | 'umum';

export type BookImage = {
    id: number;
    path: string;
    is_primary: boolean;
    sort_order: number;
};

export type Book = {
    id: number;
    title: string;
    slug: string;
    author: string | null;
    isbn: string | null;
    description: string | null;
    condition: BookCondition;
    is_new: boolean;
    price: number;
    cost_price: number | null;
    status: BookStatus;
    category_id: number | null;
    language: BookLanguage;
    audience: BookAudience;
    sold_at: string | null;
    created_at: string;
    images?: BookImage[];
    primary_image?: BookImage[];
    category?: BookCategory | null;
};

export type BookCategory = {
    id: number;
    name: string;
    slug?: string;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};
