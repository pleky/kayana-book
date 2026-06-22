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

export type Tag = {
    id: number;
    name: string;
    slug: string;
};

export type UserAddress = {
    id: number;
    label: string;
    recipient_name: string;
    recipient_phone: string;
    address_line: string;
    postal_code: string | null;
    destination_id?: number | null;
    destination_label?: string | null;
    is_default: boolean;
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
    weight_grams: number | null;
    sold_at: string | null;
    created_at: string;
    images?: BookImage[];
    primary_image?: BookImage[];
    category?: BookCategory | null;
    tags?: Tag[];
};

export type BookCategory = {
    id: number;
    name: string;
    slug?: string;
    parent_id?: number | null;
    sort_order?: number;
    books_count?: number;
};

export type OrderStatus =
    | 'pending'
    | 'paid'
    | 'shipped'
    | 'completed'
    | 'cancelled';
export type Fulfillment = 'pickup' | 'ship';

export type OrderItem = {
    id: number;
    title: string;
    price: number;
    book_id: number | null;
    cover_path?: string | null;
    book?: { id: number; slug: string } | null;
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
    recipient_name: string | null;
    recipient_phone: string | null;
    shipping_address: string | null;
    shipping_courier: string | null;
    shipping_service: string | null;
    shipping_tracking_number: string | null;
    shipped_at: string | null;
    payment_method: string;
    payment_channel: string | null;
    expires_at: string | null;
    cancel_reason: string | null;
    paid_at: string | null;
    completed_at: string | null;
    received_at: string | null;
    received_proof_paths: string[] | null;
    shipping_etd?: string | null;
    created_at: string;
    items?: OrderItem[];
    items_count?: number;
    has_updates?: boolean;
    user?: { id: number; name: string; email?: string } | null;
};

export type OrderEvent = {
    id: number;
    type:
        | 'created'
        | 'ongkir_set'
        | 'repriced'
        | 'paid'
        | 'shipped'
        | 'received'
        | 'completed'
        | 'cancelled';
    description: string;
    meta: {
        items?: {
            name: string;
            price_from?: number;
            price_to?: number;
            title_from?: string;
            title_to?: string;
        }[];
        amount?: number;
        resi?: string;
        courier?: string;
        service?: string;
        reason?: string;
    } | null;
    created_at: string;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};
