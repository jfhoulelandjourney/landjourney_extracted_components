import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-checkbox-field',
  templateUrl: './checkbox-field.component.html',
  styleUrls: ['./checkbox-field.component.scss'],
  imports: [ActivateDirective, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxFieldComponent {
  value = input<boolean>(false);
  label = input<string>('');

  readonly valueChanged = output<boolean>();

  handleValueChange() {
    const newValue = !this.value();
    this.valueChanged.emit(newValue);
  }
}
