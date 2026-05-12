import { BreakpointObserver } from '@angular/cdk/layout';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';
import { FocusWithinDirective } from '../focus-within/focus-within.directive';
import {
  BreakpointItem,
  CollapsibleState,
  isBreakpointItem,
  stringifyBreakpointItem,
} from './collapsible.model';

@Directive({
  selector: '[lj-collapsible]',
  standalone: true,
  host: {
    '(mouseenter)': 'hovered$.next(true)',
    '(mouseleave)': 'hovered$.next(false)',
  },
  hostDirectives: [FocusWithinDirective],
})
export class CollapsibleDirective implements OnDestroy {
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private breakpointObserver = inject(BreakpointObserver);

  collapsedClass = input('collapsed');
  expandedClass = input('expanded');
  fixedClass = input('fixed');
  breakpoints = input.required({
    transform: (value: BreakpointItem[] | null): BreakpointItem[] => {
      const items = (value ?? []).filter(isBreakpointItem);
      return items.length ? items : ([{}] as BreakpointItem[]);
    },
  });

  private readonly focusWithinDirective = inject(FocusWithinDirective, {
    self: true,
  });
  private focusWithin$ = this.focusWithinDirective.focusWithin$;
  protected hovered$ = new BehaviorSubject(false);

  private readonly stateSubject = new BehaviorSubject<CollapsibleState>(
    'fixed'
  );
  readonly state$ = this.stateSubject.asObservable();

  private readonly collapsibleSidebar$ = toObservable(this.breakpoints).pipe(
    map(breakpoints => breakpoints.map(stringifyBreakpointItem)),
    switchMap(breakpoints => {
      return this.breakpointObserver
        .observe(breakpoints)
        .pipe(map(({ matches }) => matches));
    })
  );

  private readonly shouldExpand$ = this.collapsibleSidebar$.pipe(
    switchMap(collapsible => {
      if (!collapsible) return of(true);

      return combineLatest({
        hovered: this.hovered$,
        focusWith: this.focusWithin$,
      }).pipe(
        map(({ hovered, focusWith }) => {
          return hovered || focusWith;
        })
      );
    })
  );

  private readonly fixedSidebarClass$ = this.collapsibleSidebar$
    .pipe(filter(mayCollapse => !mayCollapse))
    .subscribe(() => {
      this.stateSubject.next('fixed');
      this.renderer.addClass(this.elementRef.nativeElement, this.fixedClass());
      this.renderer.removeClass(
        this.elementRef.nativeElement,
        this.collapsedClass()
      );
    });

  private readonly collapsibleSidebarClass$ = combineLatest({
    isCollapsible: this.collapsibleSidebar$,
    shouldExpand: this.shouldExpand$,
  })
    .pipe(filter(({ isCollapsible }) => isCollapsible))
    .subscribe(({ shouldExpand }) => {
      if (shouldExpand) {
        this.stateSubject.next('expanded');
        this.renderer.addClass(
          this.elementRef.nativeElement,
          this.expandedClass()
        );
        this.renderer.removeClass(
          this.elementRef.nativeElement,
          this.fixedClass()
        );
        this.renderer.removeClass(
          this.elementRef.nativeElement,
          this.collapsedClass()
        );
      } else {
        this.stateSubject.next('collapsed');
        this.renderer.addClass(
          this.elementRef.nativeElement,
          this.collapsedClass()
        );
        this.renderer.removeClass(
          this.elementRef.nativeElement,
          this.fixedClass()
        );
        this.renderer.removeClass(
          this.elementRef.nativeElement,
          this.expandedClass()
        );
      }
    });

  ngOnDestroy() {
    this.fixedSidebarClass$.unsubscribe();
    this.collapsibleSidebarClass$.unsubscribe();
  }
}
