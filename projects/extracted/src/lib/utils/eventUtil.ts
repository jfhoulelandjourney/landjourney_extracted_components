export function extractTargetAndValue<T extends HTMLElement>(
  event: Event
): [T | null, unknown | null] {
  const target =
    event.target instanceof HTMLElement ? (event.target as T) : null;

  if (!target) {
    return [null, null] as const;
  }
  const value = 'value' in target ? target.value : null;
  return [target, value];
}
