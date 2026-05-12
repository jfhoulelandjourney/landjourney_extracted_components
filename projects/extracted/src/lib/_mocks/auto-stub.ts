/**
 * Auto-stub factory for Storybook.
 *
 * Returns a Proxy that satisfies most service-shaped access patterns:
 *   - `service.someMethod(...)`           → returns an empty Observable
 *   - `service.someProperty.nested`        → returns another stub (chains)
 *   - `service.someSignal()`               → returns undefined
 *   - `await service.somePromiseFn(...)`   → resolves to undefined
 *   - `service.someSubject$.subscribe(fn)` → no-op subscription
 *
 * It's not type-safe — the goal is to keep components from crashing in
 * Storybook so we can see them visually. For real behavior in a story,
 * provide a proper stub for that specific service via `applicationConfig`.
 */
import { EMPTY, of } from 'rxjs';

const isObservableShape = (prop: PropertyKey): boolean =>
  typeof prop === 'string' && prop.endsWith('$');

function buildStub(): unknown {
  const handler: ProxyHandler<() => unknown> = {
    get(_target, prop) {
      if (prop === 'then' || prop === Symbol.toPrimitive) return undefined;
      if (prop === 'subscribe') {
        return (next?: (v: unknown) => void) => {
          if (next) next(undefined);
          return { unsubscribe: () => undefined };
        };
      }
      if (prop === 'pipe') {
        return () => EMPTY;
      }
      // For property names that look like RxJS subjects/observables,
      // return a real `EMPTY` observable so `.subscribe()` and `.pipe()` work.
      if (isObservableShape(prop)) {
        return EMPTY;
      }
      // Everything else: return another callable stub. This works for
      // `service.method(...)`, `service.signal()`, and chained property
      // access alike.
      return buildStub();
    },
    apply() {
      // Calling the stub: return an empty observable. Many lib methods
      // return Observable<T>; this satisfies them. Components doing
      // `.subscribe(...)` will get a single `undefined` emission.
      return of(undefined);
    },
  };
  // The target must be callable so the Proxy supports both function-call
  // and property-access shapes.
  return new Proxy(function noop() {
    return undefined;
  }, handler);
}

export function autoStub<T>(): T {
  return buildStub() as T;
}
