import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '*[lj-label-field]',
  imports: [],
  templateUrl: './label-field.component.html',
  styleUrl: './label-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent {}
