import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, output, SimpleChanges, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { getRandomString } from '../../../utils/stringUtil';
import { LjInputComponent } from '../input/input.component';

@Component({
  selector: 'lj-editable-text-box',
  imports: [ActivateDirective, MatIconModule, FormsModule, LjInputComponent],
  templateUrl: './editable-text-box.component.html',
  styleUrl: './editable-text-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableTextBoxComponent implements OnInit, OnChanges {
  changeDetector = inject(ChangeDetectorRef);

  generatedId = getRandomString();

  @Input() inputClass = '';
  @Input() valueClass = '';
  @Input() inputType:
    | 'text'
    | 'email'
    | 'date'
    | 'datetime-local'
    | 'month'
    | 'password'
    | 'tel'
    | 'time'
    | 'url'
    | 'week' = 'text';
  @Input() value: string | undefined;
  @Input() placeholder = '';
  @Input() alwaysInEdit = false;
  @Input() locked = false;
  @Input() color: 'gray' | 'default' = 'default';
  @Input() size: 'small' | 'medium' | 'large' | 'x-large' = 'medium';
  @Input() required = false;

  inputElementRef = viewChild('editableInput', { read: ElementRef });
  readonly valueChanged = output<string>();

  editedValue = '';
  showEditBox = false;

  ngOnInit() {
    this.editedValue = this.value || '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(changes).includes('value')) {
      this.value = changes['value']?.currentValue;
      this.editedValue = this.value || '';
      this.showEditBox = false;
    }
    this.changeDetector.detectChanges();
  }

  toggleEditBox(showEditBox: boolean) {
    if (this.locked) {
      return;
    }

    if (showEditBox) {
      this.editedValue = this.value || '';
    }
    this.showEditBox = showEditBox;

    if (showEditBox) {
      setTimeout(() => {
        try {
          const inputElement = this.inputElementRef()?.nativeElement;
          inputElement.click();
          inputElement.select();
        } catch {
          // Nothing to do
        }
      }, 50);
    }

    this.changeDetector.markForCheck();
  }

  handleValueChanged() {
    if (this.alwaysInEdit) {
      return;
    }

    if (this.required && this.editedValue.trim() === '') {
      return;
    }

    this.value = this.editedValue;
    this.valueChanged.emit(this.editedValue || '');
    this.toggleEditBox(false);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!event.key) {
      return;
    }

    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
      this.handleValueChanged();
    } else if (event.key.toLowerCase() === 'escape') {
      event.preventDefault();
      event.stopPropagation();
      this.showEditBox = false;
    }

    if (this.alwaysInEdit) {
      this.value = this.editedValue;
      this.valueChanged.emit(this.value);
    }
  }

  handleInputChange(value: string) {
    if (this.alwaysInEdit) {
      this.value = value;
      this.valueChanged.emit(this.value);
    } else {
      this.editedValue = value;
    }
  }

  getValueClassList(): string {
    const classList: string[] = [
      'editable-input-display',
      this.color,
      this.size,
    ];

    if (this.valueClass) {
      classList.push(this.valueClass);
    }

    if (!this.value) {
      classList.push('is-placeholder');
    }

    return classList.join(' ');
  }
}
