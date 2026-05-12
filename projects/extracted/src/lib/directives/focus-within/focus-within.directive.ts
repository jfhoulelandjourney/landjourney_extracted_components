import { Directive, ElementRef, OnInit, OnDestroy, output, inject } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Subject } from 'rxjs';
import {
  map,
  startWith,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs/operators';

@Directive({
  selector: '[lj-focus-within]',
  standalone: true,
})
export class FocusWithinDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);

  private destroy$ = new Subject<void>();
  private startWithValue = false;

  readonly focusWithinChange = output<boolean>();
  focusWithin$ = new BehaviorSubject<boolean>(this.startWithValue);

  ngOnInit() {
    const focusIn$ = fromEvent(this.el.nativeElement, 'focusin').pipe(
      map(() => true)
    );
    const focusOut$ = fromEvent(this.el.nativeElement, 'focusout').pipe(
      map(() => false)
    );

    merge(focusIn$, focusOut$)
      .pipe(
        startWith(this.startWithValue),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(isFocusWithin => {
        this.focusWithinChange.emit(isFocusWithin);
        this.focusWithin$.next(isFocusWithin);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
