import { computed, Directive, ElementRef, OnDestroy, OnInit, output, signal, inject } from '@angular/core';

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface ZoomInfo {
  zoom: number;
  hasZoom: boolean;
  zoomElement: HTMLElement | null;
  zoomChain: Array<{ element: HTMLElement; zoom: number }>;
}

export interface AllDimensions {
  width: number;
  height: number;
  unscaledDimensions: ContainerDimensions;
  zoomInfo: ZoomInfo;
}

@Directive({
  selector: '[lj-container-dimensions]',
  standalone: true,
  exportAs: 'ljContainerDimensions',
})
export class ContainerDimensionsDirective implements OnInit, OnDestroy {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Emits the container dimensions whenever they change
   */
  readonly change = output<AllDimensions>();

  /**
   * Emits zoom information whenever it changes
   */
  readonly zoomChange = output<ZoomInfo>();

  /**
   * Container width in pixels
   */
  width = signal<number>(0);

  /**
   * Container height in pixels
   */
  height = signal<number>(0);

  /**
   * Zoom information for parent elements
   */
  zoomInfo = signal<ZoomInfo>({
    hasZoom: false,
    zoom: 1,
    zoomElement: null,
    zoomChain: [],
  });

  /**
   * Combined dimensions with width, height and zoom information
   */
  dimensions = computed<AllDimensions>(() => {
    const width = this.width();
    const height = this.height();
    const zoomInfo = this.zoomInfo();

    return {
      width,
      height,
      zoomInfo,
      unscaledDimensions: this.getUnscaledDimensions(),
    };
  });

  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private dimensionsChanged = false;
  private zoomChanged = false;

  ngOnInit(): void {
    this.setupResizeObserver();
    this.setupMutationObserver();
    this.updateDimensions();
    this.updateZoomInfo();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Updates width and height signals with current element dimensions
   */
  updateDimensions(): void {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();

    const newWidth = rect.width;
    const newHeight = rect.height;

    // Only update and emit if dimensions actually changed
    if (this.width() !== newWidth || this.height() !== newHeight) {
      this.width.set(newWidth);
      this.height.set(newHeight);
      this.dimensionsChanged = true;
    }
  }

  /**
   * Checks all parent elements for zoom CSS declarations
   */
  updateZoomInfo(): void {
    const zoomInfo = this.checkParentZoom();
    const currentZoomInfo = this.zoomInfo();

    // Only update if zoom info has changed
    if (
      currentZoomInfo.hasZoom !== zoomInfo.hasZoom ||
      currentZoomInfo.zoom !== zoomInfo.zoom ||
      currentZoomInfo.zoomChain.length !== zoomInfo.zoomChain.length
    ) {
      this.zoomInfo.set(zoomInfo);
      this.zoomChanged = true;
    }
  }

  emitDimensionsChange(): void {
    if (this.dimensionsChanged || this.zoomChanged) {
      const eventData: AllDimensions = {
        ...this.zoomInfo(),
        ...this.dimensions(),
        unscaledDimensions: this.getUnscaledDimensions(),
      };
      this.change.emit(eventData);
    }

    this.dimensionsChanged = false;
    this.zoomChanged = false;
  }

  /**
   * Traverses up the DOM tree to find elements with zoom CSS declarations
   */
  private checkParentZoom(): ZoomInfo {
    const zoomChain: Array<{ element: HTMLElement; zoom: number }> = [];
    let currentElement: HTMLElement | null =
      this.elementRef.nativeElement.parentElement;
    let totalZoom = 1;
    let hasZoom = false;
    let firstZoomElement: HTMLElement | null = null;

    while (currentElement && currentElement !== document.documentElement) {
      const computedStyle = window.getComputedStyle(currentElement);
      const zoomValue = this.parseZoomValue(
        String('zoom' in computedStyle ? computedStyle.zoom : '')
      );

      if (zoomValue !== 1) {
        hasZoom = true;
        totalZoom *= zoomValue;

        if (!firstZoomElement) {
          firstZoomElement = currentElement;
        }

        zoomChain.push({
          element: currentElement,
          zoom: zoomValue,
        });
      }

      currentElement = currentElement.parentElement;
    }

    return {
      hasZoom,
      zoom: totalZoom,
      zoomElement: firstZoomElement,
      zoomChain: zoomChain.reverse(), // Reverse to show from top-level parent to immediate parent
    };
  }

  /**
   * Parses zoom value from CSS zoom string
   */
  private parseZoomValue(zoomString: string): number {
    if (!zoomString || zoomString === 'normal' || zoomString === 'auto') {
      return 1;
    }

    // Handle percentage values (e.g., "85%")
    if (zoomString.endsWith('%')) {
      const percentage = parseFloat(zoomString.slice(0, -1));
      return isNaN(percentage) ? 1 : percentage / 100;
    }

    // Handle decimal values (e.g., "0.85", "1.2")
    const numericValue = parseFloat(zoomString);
    return isNaN(numericValue) ? 1 : numericValue;
  }

  /**
   * Sets up the ResizeObserver to monitor element size changes
   */
  private setupResizeObserver(): void {
    if (!this.elementRef?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      // Cancel any pending animation frame
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      // Use requestAnimationFrame to throttle updates
      this.rafId = requestAnimationFrame(() => {
        // Double-check element still exists (component might be destroyed)
        if (this.elementRef?.nativeElement) {
          this.updateDimensions();
          this.updateZoomInfo(); // Also check zoom changes
          this.emitDimensionsChange();
        }
        this.rafId = null;
      });
    });

    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  /**
   * Sets up MutationObserver to watch for style changes on parent elements
   */
  private setupMutationObserver(): void {
    if (!this.elementRef?.nativeElement) return;

    this.mutationObserver = new MutationObserver(mutations => {
      const hasStyleChange = mutations.some(
        mutation =>
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
      );

      if (hasStyleChange) {
        // Debounce zoom info updates
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }

        this.rafId = requestAnimationFrame(() => {
          this.updateZoomInfo();
          this.emitDimensionsChange();
          this.rafId = null;
        });
      }
    });

    // Observe the entire document for style changes (zoom could be applied anywhere in the chain)
    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true,
    });
  }

  /**
   * Clean up all resources
   */
  private cleanup(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Public method to manually check zoom
   */
  checkZoom(): ZoomInfo {
    return this.checkParentZoom();
  }

  /**
   * Public method to get the effective dimensions (accounting for zoom)
   */
  getUnscaledDimensions(): ContainerDimensions {
    const zoom = this.zoomInfo().zoom;
    return {
      width: this.width() / zoom,
      height: this.height() / zoom,
    };
  }
}
