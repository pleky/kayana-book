import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

type Variant = 'up' | 'left' | 'right' | 'scale' | 'blur';

/**
 * Reveals its children once they scroll into view via IntersectionObserver.
 * Reduced-motion users get the final state immediately. The actual transition
 * lives in app.css (`[data-reveal]`), so this only toggles `is-visible`.
 */
export function Reveal({
    children,
    className,
    variant = 'up',
    delay = 0,
    as: Tag = 'div',
}: {
    children: ReactNode;
    className?: string;
    variant?: Variant;
    delay?: number;
    as?: 'div' | 'section' | 'li';
}) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;

        if (!el) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.classList.add('is-visible');

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('is-visible');
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref as never}
            data-reveal={variant === 'up' ? '' : variant}
            style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
            className={className}
        >
            {children}
        </Tag>
    );
}
