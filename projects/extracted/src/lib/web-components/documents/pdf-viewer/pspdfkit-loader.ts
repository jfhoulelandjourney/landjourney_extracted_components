/**
 * Lazy loader for the Nutrient SDK (@nutrient-sdk/viewer)
 *
 * This module provides a cached dynamic import of PSPDFKit to ensure:
 * 1. The 200MB+ SDK is split into a separate chunk (not in main bundle)
 * 2. The SDK is only downloaded when the PDF viewer is actually needed
 * 3. Multiple components can share the same cached import
 */

import type PSPDFKitType from '@nutrient-sdk/viewer';

// Cache the module promise to avoid re-importing
let pspdfkitPromise: Promise<typeof PSPDFKitType> | null = null;

/**
 * Lazily loads the PSPDFKit module.
 * The module is cached after first load.
 *
 * @returns Promise resolving to the PSPDFKit module
 *
 * @example
 * const PSPDFKit = await loadPSPDFKit();
 * const instance = await PSPDFKit.load({ ... });
 */
export async function loadPSPDFKit(): Promise<typeof PSPDFKitType> {
  if (!pspdfkitPromise) {
    pspdfkitPromise = import('@nutrient-sdk/viewer').then(
      module => module.default
    );
  }
  return pspdfkitPromise;
}

/**
 * Preloads the PSPDFKit module without waiting for it.
 * Useful to start loading early (e.g., on route navigation).
 */
export function preloadPSPDFKit(): void {
  if (!pspdfkitPromise) {
    pspdfkitPromise = import('@nutrient-sdk/viewer').then(
      module => module.default
    );
  }
}
