import { useState } from 'react';
import { Input } from '@/components/ui/input';

/** Group digits with a dot every three places, Indonesian style: 450000 → 450.000. */
function group(raw: string): string {
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Rupiah amount field. The visible input shows grouped digits for legibility;
 * a hidden sibling carries the raw integer string under the real `name`, so the
 * server receives a clean value (e.g. "450000") with no separators.
 */
export default function MoneyInput({
    id,
    name,
    defaultValue,
    required = false,
    placeholder,
}: {
    id: string;
    name: string;
    defaultValue?: number | null;
    required?: boolean;
    placeholder?: string;
}) {
    const [raw, setRaw] = useState(
        defaultValue !== null && defaultValue !== undefined
            ? String(defaultValue)
            : '',
    );

    return (
        <div className="relative">
            <input type="hidden" name={name} value={raw} />
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
            </span>
            <Input
                id={id}
                inputMode="numeric"
                required={required}
                placeholder={placeholder}
                value={group(raw)}
                onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))}
                className="pl-9"
            />
        </div>
    );
}
