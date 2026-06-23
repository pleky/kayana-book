/** Indonesian Rupiah, no decimals — the app-wide currency formatter. */
export const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

/** Convenience wrapper around {@link rupiah}. */
export function formatRupiah(amount: number): string {
    return rupiah.format(amount);
}
