import {
  ChangeDetectionStrategy,
  Component,
  model,
  output,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import {
  FormOptions,
  FormTypes,
} from '../../../../models/dynamic-forms.models';

@Component({
  selector: 'lj-form-type-selector',
  imports: [MatTooltipModule, ActivateDirective, MatCheckboxModule],
  templateUrl: './form-type-selector.component.html',
  styleUrl: './form-type-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTypeSelectorComponent {
  formTypes = FormTypes;
  formTypesOptions = [
    {
      label: FormTypes.INLINE,
      value: FormTypes.INLINE,
      description: 'Form without tabs or steps to isolate the sections',
    },
    {
      label: FormTypes.STEPS,
      value: FormTypes.STEPS,
      description: 'Form with each section displayed as a different step',
    },
    {
      label: FormTypes.TABS,
      value: FormTypes.TABS,
      description: 'Form with each section displayed as tabs',
    },
  ];

  formType = model<FormTypes>(FormTypes.INLINE);
  formOptions = model.required<FormOptions>();

  readonly change = output<{
    formType: FormTypes;
    formOptions: FormOptions;
  }>();

  handleTypeChange(formType: FormTypes) {
    this.formType.set(formType);
    const formOptions = this.formOptions();
    this.change.emit({
      formType: this.formType(),
      formOptions: {
        ...formOptions,
        useHeaderNavigation: formType !== FormTypes.INLINE,
      },
    });
  }
}
