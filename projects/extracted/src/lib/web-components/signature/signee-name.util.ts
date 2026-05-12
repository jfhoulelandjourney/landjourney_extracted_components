const AUTO_NAME_RE = /^Signee #(\d+)$/;

/**
 * Suggest the next default name for a new signee, derived from the current list.
 *
 * Rules:
 * - If any existing signee is still named `Signee #N`, the next is `Signee #(max(N)+1)`
 *   — so an auto-named survivor (e.g. `Signee #10` left alone while its 9 siblings were
 *   renamed) ensures the next index doesn't collide with it after save/reload.
 * - If no existing signee carries the auto-name shape, fall back to `Signee #(count+1)`
 *   — a fully-renamed template restarts numbering from a small index.
 */
export function nextAutoSigneeName(
  signees: readonly { name: string }[]
): string {
  const indices = signees
    .map(s => AUTO_NAME_RE.exec(s.name)?.[1])
    .filter((s): s is string => s !== undefined)
    .map(s => Number.parseInt(s, 10));
  const next =
    indices.length === 0 ? signees.length + 1 : Math.max(...indices) + 1;
  return `Signee #${next}`;
}
