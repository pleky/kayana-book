import type { BookCondition, BookStatus } from '@/types';

export const BOOK_CONDITION_LABEL: Record<BookCondition, string> = {
    like_new: 'Seperti baru',
    good: 'Bagus',
    fair: 'Cukup',
    poor: 'Kurang',
};

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
    available: 'Tersedia',
    reserved: 'Dipesan',
    sold: 'Terjual',
};

export const BOOK_STATUS_VARIANT: Record<
    BookStatus,
    'default' | 'secondary' | 'outline'
> = {
    available: 'default',
    reserved: 'secondary',
    sold: 'outline',
};
