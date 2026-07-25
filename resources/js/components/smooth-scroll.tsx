import Lenis from 'lenis';
import { useEffect } from 'react';

/**
 * Global smooth-scroll via Lenis. Smooths native scroll (wheel/trackpad
 * inertia) without transforming content, so `window.scrollTop`, scroll
 * events, `position: sticky`, and the hero parallax all keep working.
 * Disabled entirely for `prefers-reduced-motion: reduce`.
 */
export function SmoothScroll() {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const lenis = new Lenis({ anchors: true });

        let frame = 0;
        const raf = (time: number) => {
            lenis.raf(time);
            frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(frame);
            lenis.destroy();
        };
    }, []);

    return null;
}
