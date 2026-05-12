import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { DeviceDetectorService } from 'ngx-device-detector';
import { NgxPrintModule } from 'ngx-print';
import { Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { SafeHtmlPipe } from '../../../pipes/safe-html/safe-html.pipe';
import { IAMService } from '../../../services/identity/iam.service';
import {
  Condition,
  ConditionScopes,
} from '../../../services/organization/conditions.models';
import { OrganizationService } from '../../../services/organization/organization.service';
import { LjButtonComponent } from '../../button/button.component';
import { loadPdfMakeWithFallback } from './load-pdfmake';

const PLACEHOLDER_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

@Component({
  selector: 'lj-accept-conditions',
  imports: [
    LjButtonComponent,
    ActivateDirective,
    SafeHtmlPipe,
    NgxPrintModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
  ],
  templateUrl: './accept-conditions.component.html',
  styleUrl: './accept-conditions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class AcceptConditionsComponent implements OnDestroy {
  private readonly iamService = inject(IAMService);
  private readonly organizationService = inject(OrganizationService);
  private readonly deviceDetector = inject(DeviceDetectorService);

  mobile = input(false);

  conditionsToAccept = signal<Condition[]>([]);
  conditionsToReview = model<Condition[]>([]);
  mode = input<'accept' | 'review'>('accept');

  confirmationCheck = model<boolean>(false);

  readonly closeReview = output<void>();

  conditions = computed(() => {
    if (this.mode() === 'accept') {
      return this.conditionsToAccept().sort(
        (a, b) => (a.priority ?? 10) - (b.priority ?? 10)
      );
    } else {
      return this.conditionsToReview().sort(
        (a, b) => (a.priority ?? 10) - (b.priority ?? 10)
      );
    }
  });

  // LIFECYCLE

  private destroy$ = new Subject<void>();

  constructor() {
    const scope: ConditionScopes = this.isBackoffice()
      ? ConditionScopes.EMPLOYEE
      : ConditionScopes.CUSTOMER;

    this.iamService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          const user = this.iamService.getActiveUser();
          const conditions = user?.conditionsToAccept ?? [];
          this.conditionsToAccept.set(
            conditions.filter(condition =>
              [ConditionScopes.ALL, scope].includes(condition.scope)
            )
          );
        } else {
          this.conditionsToAccept.set([]);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // UI

  async downloadToPdf() {
    const pdfContent = document.getElementById('condition-text');
    if (!pdfContent) return;

    const { pdfMake, pdfFonts } = await loadPdfMakeWithFallback();

    const htmlToPdfMakeModule = await import(
      /* @ts-expect-error type not available */
      'html-to-pdfmake'
    );
    const htmlToPdfMake = htmlToPdfMakeModule.default ?? htmlToPdfMakeModule;

    const images = pdfContent.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(async img => {
      const url = img.src;
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) return PLACEHOLDER_IMAGE;
        const blob = await response.blob();
        return new Promise<string>((resolve, _reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(PLACEHOLDER_IMAGE);
          reader.readAsDataURL(blob);
        });
      } catch {
        return PLACEHOLDER_IMAGE;
      }
    });
    const imageDataUrls = await Promise.all(imagePromises);
    let htmlContent = pdfContent.innerHTML;
    Array.from(images).forEach((img, index) => {
      const dataUrl = imageDataUrls[index];
      if (dataUrl !== undefined && dataUrl !== null) {
        htmlContent = htmlContent.replaceAll(img.src, dataUrl);
      }
    });

    const content = htmlToPdfMake(htmlContent, {
      window: window,
      defaultStyles: {},
    });
    const documentDefinition = {
      content,
      styles: {},
      defaultStyle: {},
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const fontsModule = pdfFonts as any;
    const vfs =
      fontsModule?.pdfMake?.vfs ??
      fontsModule?.vfs ??
      (typeof fontsModule === 'object' &&
      fontsModule !== null &&
      'Roboto-Regular.ttf' in fontsModule
        ? fontsModule
        : {});
    (pdfMake as any).vfs = vfs;
    (pdfMake as any)
      .createPdf(documentDefinition)
      .download(`${this.conditions().at(0)?.title ?? 'exported-text'}.pdf`);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  displayPrintButton(): boolean {
    return !this.deviceDetector.isMobile() && !this.deviceDetector.isTablet();
  }

  displayConfirmationCheckBox(condition: Condition | undefined): boolean {
    if (!condition) {
      return false;
    }
    return (
      Boolean(condition.disclaimerText) &&
      condition.disclaimerText?.trim() !== ''
    );
  }

  isBackoffice(): boolean {
    return (
      window.location.hostname.toLowerCase().includes('backoffice.') ||
      window.location.hostname.toLowerCase().includes('backoffice-test.') ||
      window.location.hostname.toLowerCase().includes('backoffice-integration.')
    );
  }

  // API INTERACTIONS

  acceptCurrentCondition() {
    if (
      this.displayConfirmationCheckBox(this.conditionsToAccept().at(0)) &&
      !this.confirmationCheck()
    ) {
      return;
    }

    const condition = this.conditionsToAccept().at(0);

    if (!condition) {
      return;
    }

    this.organizationService.acceptCondition(condition).subscribe({
      next: () => {
        let conditions = structuredClone(this.conditionsToAccept());
        conditions = conditions.filter(c => c.id !== condition.id);
        this.conditionsToAccept.set(conditions);
        this.confirmationCheck.set(false);

        if (this.conditionsToAccept().length === 0) {
          this.iamService.removeConditionsFromActiveUser();
        }
      },
    });
  }

  close() {
    if (this.mode() === 'review') {
      this.closeReview.emit();
    }
  }

  logout() {
    this.iamService.logout();
    this.conditionsToAccept.set([]);
  }
}
