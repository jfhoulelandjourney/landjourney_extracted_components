export const DF_WAVE_STAGGER_BASE_MS = 60;
export const DF_WAVE_STAGGER_STEP_MS = 45;

export function dfPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function scheduleDfWaveIntro(root: HTMLElement | undefined): () => void {
  const timers: number[] = [];

  const clearTimers = () => {
    timers.forEach(id => window.clearTimeout(id));
    timers.length = 0;
  };

  const revealAll = () => {
    root
      ?.querySelectorAll<HTMLElement>('.df-wave-item')
      .forEach(el => el.classList.add('is-visible'));
  };

  if (!root) {
    return clearTimers;
  }

  if (dfPrefersReducedMotion()) {
    revealAll();
    return clearTimers;
  }

  window.requestAnimationFrame(() => {
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('.df-wave-item')
    );
    items.forEach((el, index) => {
      const id = window.setTimeout(() => {
        el.classList.add('is-visible');
      }, DF_WAVE_STAGGER_BASE_MS + index * DF_WAVE_STAGGER_STEP_MS);
      timers.push(id);
    });
  });

  return clearTimers;
}
