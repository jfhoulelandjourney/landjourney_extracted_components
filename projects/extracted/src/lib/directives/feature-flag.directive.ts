import {
  Directive,
  inject,
  Injector,
  input,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { OrganizationService } from '../services/organization/organization.service';

@Directive({
  selector: '[lj-feature-flag]',
  standalone: true,
})
export class LjFeatureFlagDirective {
  injector = inject(Injector);
  templateRef = inject(TemplateRef);
  viewContainer = inject(ViewContainerRef);
  organizationService = inject(OrganizationService);

  // --- Signal-based Inputs ---
  featureFlag = input.required({
    alias: 'lj-feature-flag',
    transform: (value: string) => value.trim(),
  });
  elseTemplate = input<TemplateRef<unknown> | null>(null, {
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'lj-feature-flagElse',
  });

  hasView = signal(false);

  constructor() {
    this.setupFeatureFlagListener();
  }

  private setupFeatureFlagListener(): void {
    toObservable(this.featureFlag, { injector: this.injector })
      .pipe(
        map(ff => this.organizationService.isFeatureFlagActivated(ff)),
        takeUntilDestroyed()
      )
      .subscribe(active => {
        this.updateView(active);
      });
  }

  private updateView(active: boolean): void {
    if (active) {
      // If feature flag is enabled and view isn't created, create it.
      if (!this.hasView()) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView.set(true);
      }
    } else {
      // If feature flag is disabled, clear the main view.
      if (this.hasView) {
        this.viewContainer.clear();
        this.hasView.set(false);
      }
      // And if an "else" template is provided, render it.
      const elseTpl = this.elseTemplate();
      if (elseTpl) {
        this.viewContainer.createEmbeddedView(elseTpl);
      }
    }
  }
}
