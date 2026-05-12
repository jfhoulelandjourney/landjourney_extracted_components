import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  signal,
  ViewChild,
  type ElementRef,
} from '@angular/core';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-editable-input',
  templateUrl: './editable-input.component.html',
  styleUrls: ['./editable-input.component.scss'],
  imports: [ActivateDirective],
})
export class EditableInputComponent {
  @ViewChild('editableInput') editableInput!: ElementRef<HTMLInputElement>;

  value = model<string | number | undefined>(undefined);
  rightAlign = input(false);
  label = input('');
  name = input('');
  type = input<'text' | 'number'>('text');
  readonly onValueChange = output<string | number>();

  isEditing = signal(false);

  handleValueChange(event: Event): void {
    if (!this.isEditing()) return;

    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value.trim();

    if (newValue === '' && this.type() !== 'text') {
      this.isEditing.set(false);
      return;
    }

    this.isEditing.set(false);
    this.onValueChange.emit(newValue);
  }

  startEdit(): void {
    this.isEditing.set(true);
    setTimeout(() => {
      this.editableInput?.nativeElement?.focus();
    });
  }

  stopEdit(): void {
    this.isEditing.set(false);
  }
}
