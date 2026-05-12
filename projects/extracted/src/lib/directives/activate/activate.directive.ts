import { Directive, ElementRef, input, output, OnInit, OnDestroy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  distinctUntilChanged,
  merge,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  throttleTime,
} from 'rxjs';
import { isEqual } from 'es-toolkit';
import {
  listenClickAndKeyboard,
  ValidKeyboardEvent,
} from '../../utils/observableUtil';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[activate]',
  standalone: true,
})
export class ActivateDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);

  private destroy$ = new Subject<void>();
  readonly activate = output<MouseEvent | KeyboardEvent>();

  throttle = input<number>(200);
  keyboardEvent = input<Array<ValidKeyboardEvent>>(['keyup']);
  keys = input<Array<KeyboardEvent['key']>>(['Enter', 'Space']);

  throttle$ = toObservable(this.throttle);
  keyboardEvent$ = toObservable(this.keyboardEvent);
  keys$ = toObservable(this.keys);

  ngOnInit() {
    merge(
      this.throttle$.pipe(startWith(this.throttle()), distinctUntilChanged()),
      this.keyboardEvent$.pipe(
        startWith(this.keyboardEvent()),
        distinctUntilChanged(isEqual)
      ),
      this.keys$.pipe(startWith(this.keys()), distinctUntilChanged(isEqual))
    )
      .pipe(
        switchMap(() => {
          return listenClickAndKeyboard(this.elementRef, {
            keyboardEvent: this.keyboardEvent(),
            keys: this.keys(),
          }).pipe(throttleTime(this.throttle(), undefined));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.activate.emit(event);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
