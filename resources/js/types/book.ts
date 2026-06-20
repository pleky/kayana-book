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
    parent_id?: number | null;
    sort_order?: number;
    books_count?: number;
};

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';
export type Fulfillment = 'pickup' | 'ship';

export type OrderItem = {
    id: number;
    title: string;
    price: number;
    book_id: number | null;
};

export type Order = {
    id: number;
    status: OrderStatus;
    subtotal: number;
    shipping_cost: number;
    total: number;
    customer_name: string;
    customer_phone: string;
    fulfillment: Fulfillment;
    shipping_address: string | null;
    payment_method: string;
    expires_at: string | null;
    cancel_reason: string | null;
    paid_at: string | null;
    created_at: string;
    items?: OrderItem[];
    items_count?: number;
    user?: { id: number; name: string; email?: string } | null;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};
