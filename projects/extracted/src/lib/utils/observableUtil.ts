import { ElementRef, WritableSignal } from '@angular/core';
import {
  defer,
  delayWhen,
  filter,
  finalize,
  fromEvent,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  tap,
  timer,
} from 'rxjs';

export type ValidKeyboardEvent = 'keyup' | 'keydown';

/**
 * Listens for both click events and specified keyboard events on a given element.
 * Emits a `MouseEvent` for click events and a `KeyboardEvent` for the specified keyboard events with the provided keys.
 * By default, it listens for 'keyup' events on the 'Enter' key.
 *
 * @remarks
 * - This function calls `stopPropagation()` on both click and matching keyboard events to prevent the events from propagating further up the DOM tree.
 * - It filters out repeated key presses for keyboard events.
 * - When the returned Observable is unsubscribed, the event listeners created by `fromEvent` are automatically removed, preventing memory leaks.
 */
export function listenClickAndKeyboard(
  elementRef: ElementRef<HTMLElement>,
  options: {
    keyboardEvent?: ValidKeyboardEvent[];
    keys?: string[] | 'ANY';
  } = {}
): Observable<KeyboardEvent | MouseEvent> {
  const { keyboardEvent = ['keyup'], keys = ['Enter'] } = options;

  const click$ = fromEvent<MouseEvent>(elementRef.nativeElement, 'click').pipe(
    filter(event => {
      // Clicks from keyboard (e.g., Enter or Space) have detail 0
      // and will be handled by the keyboard$ observable
      return event.detail > 0;
    }),
    tap(event => event.stopPropagation())
  );

  const keyboard$ = merge(
    ...keyboardEvent.map(event =>
      fromEvent<KeyboardEvent>(elementRef.nativeElement, event).pipe(
        tap(event => event.stopPropagation()),
        filter((event: KeyboardEvent) => {
          // If keys is 'ANY', allow any key press
          if (keys === 'ANY') {
            return true;
          }
          // If keys is an array, check if the pressed key is in the array
          // Also ensure that the event is not a repeated key press
          return keys.includes(event.key) && !event.repeat;
        })
      )
    )
  );

  return merge(click$, keyboard$);
}

/**
 * Custom RxJS operator to manage a loading signal.
 * Sets the signal to true on subscription and false on termination (complete, error, unsubscribe).
 * **NOTE**:
 *  This operator should ideally be the last one in the pipe for predictable behavior.
 *  This operator should be used only on observables aimed for completion (e.g. HTTP requests).
 *
 * @param indicator The WritableSignal<boolean> to manage.
 */
export function trackLoadingStatus<T>(
  indicator: WritableSignal<boolean>
): MonoTypeOperatorFunction<T> {
  // Use defer to ensure the side effect happens upon subscription, not creation.
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      indicator.set(true);
      return source.pipe(
        tap({
          error: () => {
            indicator.set(false);
          },
          complete: () => {
            indicator.set(false);
          },
        }),
        finalize(() => {
          // Handle the case when the observable is unsubscribed
          if (indicator()) {
            indicator.set(false);
          }
        })
      );
    });
}

/**
 * Ensures a minimum time interval between value emissions from an observable.
 * Errors and completion events are emitted immediately, without any delay.
 * If emissions occur faster than the specified `minimumMs`, a delay is introduced
 * to enforce this minimum interval. If emissions are already spaced out by
 * more than `minimumMs`, no additional delay is added. The timing starts from
 * the point of subscription for the first emission.
 *
 * @param minimumMs The minimum time in milliseconds that must elapse between emissions.
 * @returns A function that takes an Observable and returns a new Observable with the enforced minimum emission interval.
 */
export function ensureMinimumTime<T>(
  minimumMs: number
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    if (minimumMs <= 0) {
      return source;
    }
    return defer(() => {
      let lastEmissionTime: number | null = null;
      const startTime = new Date().getTime();
      return source.pipe(
        delayWhen(() => {
          const now = new Date().getTime();
          let delayTime = 0;

          // For subsequent emissions
          if (lastEmissionTime !== null) {
            const timeSinceLastEmission = now - lastEmissionTime;
            delayTime = Math.max(0, minimumMs - timeSinceLastEmission);
          }
          // For the very first emission after subscription
          else {
            const timeSinceStart = now - startTime;
            delayTime = Math.max(0, minimumMs - timeSinceStart);
          }

          // Update the last emission time to the time the current emission will occur
          lastEmissionTime = now + delayTime;
          return timer(delayTime);
        })
      );
    });
  };
}
