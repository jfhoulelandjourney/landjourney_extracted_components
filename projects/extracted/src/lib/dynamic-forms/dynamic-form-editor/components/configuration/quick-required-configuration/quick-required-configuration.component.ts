import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import type { DynamicFormField } from '../../../../models/dynamic-forms.models';

@Component({
  selector: 'lj-quick-required-configuration',
  imports: [
    MatButtonModule,
    ActivateDirective,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './quick-required-configuration.component.html',
  styleUrl: './quick-required-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickRequiredConfigurationComponent {
  field = input.required<DynamicFormField<unknown>>();
  readonly handleFieldChange = output<DynamicFormField<unknown>>();

  handledRequiredChange(checked: boolean) {
    this.handleFieldChange.emit({
      ...this.field(),
      required: checked,
    });
  }
}
