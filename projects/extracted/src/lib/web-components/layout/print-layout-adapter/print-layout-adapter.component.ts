import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, timeout } from 'rxjs';
import { IAMService } from '../../../services/identity/iam.service';
import { getUUID4 } from '../../../utils/stringUtil';
import { TimeUtil } from '../../../utils/timeUtil';

@Component({
  selector: 'lj-print-layout-adapter',
  imports: [],
  styleUrl: './print-layout-adapter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-layout-adapter.component.html',
  // eslint-disable-next-line
  encapsulation: ViewEncapsulation.None,
})
export class PrintLayoutAdapterComponent {
  private readonly iamService = inject(IAMService);
  private addedPageBreaks = new Set<HTMLElement>();

  // had to add a prefix to the printer id to ensure it starts with letter (valid css selector)
  printerId = `printer-${getUUID4()}`;

  readonly imageLoaded = signal(false);
  private imageLoaded$ = toObservable(this.imageLoaded);

  logo = input.required<string>();
  // We allow for logo override in case we don't have small logo version in config
  // it allows more control on logo size depending on which PDF we want to print
  logoWidth = input<number | undefined>(undefined);

  showTimestamp = input(true);
  showUserEmail = input<boolean>(true);
  referenceId = input<string | undefined>(undefined);
  title = input<string | undefined | null>(undefined);

  onImageLoaded(): void {
    this.imageLoaded.set(true);
  }

  onImageError(): void {
    this.imageLoaded.set(true);
    const img = document.querySelector(`#${this.printerId} img`);
    if (img) {
      img.remove();
    }
  }

  async whenReady(): Promise<void> {
    if (this.imageLoaded()) {
      return;
    }

    try {
      await firstValueFrom(
        this.imageLoaded$.pipe(filter(Boolean), timeout(3000))
      );
    } catch {
      this.onImageError();
    }
  }

  getCurrentUserEmail(): string {
    return this.iamService.getActiveUser()?.email ?? '';
  }

  getTimestamp(): string {
    const timestamp = TimeUtil.getTimestampSeconds();
    return (
      TimeUtil.convertSecondTimestampToLocaleDateString(timestamp) ??
      `${timestamp}`
    );
  }

  // Print helper methods for page break

  private removePageBreaks() {
    this.addedPageBreaks.forEach(el => {
      el.classList.remove('print-content-page-break');
    });
    this.addedPageBreaks.clear();
  }

  private addPageBreak(element: HTMLElement) {
    element.classList.add('print-content-page-break');
    this.addedPageBreaks.add(element);
  }

  private getBlockHeight(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    const marginTop = parseFloat(style.marginTop);
    const marginBottom = parseFloat(style.marginBottom);

    return rect.height + marginTop + marginBottom;
  }

  private getMaxPageHeight(rootElement: HTMLElement): number {
    const contentWidth = rootElement.getBoundingClientRect().width || 1000;
    // Keep this aligned with print CSS width ratio (8.5x11 pages)
    return (contentWidth / 8.5) * 11 - 200;
  }

  private setPageBreaks(rootElement: HTMLElement) {
    this.removePageBreaks();
    const MAX_PAGE_HEIGHT_PX = this.getMaxPageHeight(rootElement);
    const children = Array.from(rootElement.children) as HTMLElement[];
    this.setPageBreakChildren(children, 0, MAX_PAGE_HEIGHT_PX);
  }

  private setPageBreakChildren(
    elements: HTMLElement[],
    currentAccumulatedHeight: number,
    maxPageHeight: number
  ): number {
    for (const block of elements) {
      const castedBlock = block as HTMLElement;
      const blockHeight = this.getBlockHeight(castedBlock);
      const blockIsTooLong =
        currentAccumulatedHeight + blockHeight > maxPageHeight;

      if (castedBlock.classList.contains('print-content-page-break')) {
        currentAccumulatedHeight = blockHeight;
        continue;
      }

      if (blockIsTooLong) {
        if (blockHeight > maxPageHeight) {
          const children = Array.from(block.children) as HTMLElement[];

          if (children.length === 0) {
            console.error(
              'Cannot display element. The height of the element is greater than a page height. Element will be cut off from print.'
            );
            currentAccumulatedHeight = blockHeight;
          } else {
            currentAccumulatedHeight = this.setPageBreakChildren(
              children,
              0,
              maxPageHeight
            );
          }
        } else {
          this.addPageBreak(castedBlock);
          currentAccumulatedHeight = blockHeight;
        }

        continue;
      }

      currentAccumulatedHeight += blockHeight;
    }

    return currentAccumulatedHeight;
  }

  // Private methods for manipulating header

  private insertHeader(rootElement: HTMLElement) {
    const header = document.getElementById(this.printerId);
    if (header) {
      rootElement.prepend(header.cloneNode(true));
    }
  }

  private removeHeader(rootElement: HTMLElement) {
    const header = rootElement.querySelector(`#${this.printerId}`);

    if (header) {
      header.remove();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  private async waitForStableLayout(rootElement: HTMLElement): Promise<void> {
    let previousHeight = -1;
    let stableSamples = 0;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.sleep(120);
      const height = Math.ceil(rootElement.getBoundingClientRect().height);
      if (height === previousHeight) {
        stableSamples += 1;
        if (stableSamples >= 2) return;
      } else {
        stableSamples = 0;
        previousHeight = height;
      }
    }
  }

  public async print(rootElement: HTMLElement): Promise<void> {
    await this.whenReady();
    this.insertHeader(rootElement);
    await this.waitForStableLayout(rootElement);
    this.setPageBreaks(rootElement);
    window.print();
    this.removePageBreaks();
    this.removeHeader(rootElement);
  }
}
