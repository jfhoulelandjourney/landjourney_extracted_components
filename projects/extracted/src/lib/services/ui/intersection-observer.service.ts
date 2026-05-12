import { ElementRef, Injectable, OnDestroy, QueryList } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IntersectionObserverService implements OnDestroy {
  private observer: IntersectionObserver | undefined;
  private destroy$ = new Subject<void>();
  private observedElements = new Set<Element>(); // Track observed elements

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
      this.observedElements.clear();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  init(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    if (this.observer) {
      throw new Error('IntersectionObserver already initialized');
    }
    this.observer = new IntersectionObserver(callback, options);
    return this.observer;
  }

  observeQueryList<T extends { nativeElement: Element }>(
    elements: QueryList<T>
  ): void {
    elements.changes.pipe(takeUntil(this.destroy$)).subscribe(changes => {
      // Unobserve removed elements
      this.observedElements.forEach((_, element) => {
        if (!changes.find((el: T) => el.nativeElement === element)) {
          this.unobserve(element);
        }
      });

      // Observe new elements
      changes.forEach((el: T) => {
        if (!this.observedElements.has(el.nativeElement)) {
          this.observe(el.nativeElement);
        }
      });
    });

    // Initial observation
    elements.forEach(element => {
      if (!this.observedElements.has(element.nativeElement)) {
        this.observe(element.nativeElement);
      }
    });
  }

  observeChildren(elements: readonly ElementRef[]): void {
    elements.forEach(element => {
      if (!this.observedElements.has(element.nativeElement)) {
        this.observe(element.nativeElement);
      } else {
        this.unobserve(element.nativeElement);
      }
    });
  }

  observe(element: Element): void {
    if (this.observer) {
      this.observer?.observe(element);
      this.observedElements.add(element);
    }
  }

  unobserve(element: Element): void {
    this.observer?.unobserve(element);
    this.observedElements.delete(element);
  }
}
