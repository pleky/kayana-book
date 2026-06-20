import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

// Dark mode is disabled — the app is locked to light. These helpers keep the
// original public API so callers (settings, toggles) keep working as no-ops.
const forceLight = (): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
};

const noopSubscribe = (): (() => void) => () => {};

export function initializeTheme(): void {
    forceLight();
}

export function useAppearance(): UseAppearanceReturn {
    const appearance = useSyncExternalStore<Appearance>(
        noopSubscribe,
        () => 'light',
        () => 'light',
    );

    const updateAppearance = (): void => {
        forceLight();
    };

    return {
        appearance,
        resolvedAppearance: 'light',
        updateAppearance,
    } as const;
}
