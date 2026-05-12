import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LjButton2Component } from '../../button2/button.component';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import { LjTextareaFieldComponent } from '../../form/textarea-field/textarea-field.component';

@Component({
  selector: 'lj-template-summary',
  imports: [
    ActivateDirective,
    LjButton2Component,
    LjInputFieldComponent,
    LjTextareaFieldComponent,
    MatIcon,
  ],
  templateUrl: './template-summary.component.html',
  styleUrl: './template-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LjTemplateSummaryComponent {
  inputName = model<string>('', {
    alias: 'name',
  });
  inputDescription = model<string>('', {
    alias: 'description',
  });
  mode = model<'view' | 'edit' | 'edit-and-confirm'>('view');

  protected innerName = signal<string>('');
  protected innerDescription = signal<string>('');

  protected nameInteracted = signal(false);
  protected readonly nameRequiredError = computed(() => {
    const isEditing =
      this.mode() === 'edit' || this.mode() === 'edit-and-confirm';
    if (!isEditing) {
      return undefined;
    }

    if (!this.nameInteracted()) {
      return undefined;
    }

    return this.innerName().trim() === ''
      ? 'This field is required'
      : undefined;
  });

  readonly summaryChange = output<{ name: string; description: string }>();

  constructor() {
    effect(() => {
      const name = this.inputName();
      const description = this.inputDescription();

      untracked(() => {
        this.innerName.set(name);
        this.innerDescription.set(description);
      });
    });
  }

  onNameChange(name: string | null) {
    this.nameInteracted.set(true);
    this.innerName.set(name ?? '');
    if (this.mode() === 'edit') {
      this.emitChange();
    }
  }
  onDescriptionChange(description: string | null) {
    this.innerDescription.set(description ?? '');
    if (this.mode() === 'edit') {
      this.emitChange();
    }
  }

  edit() {
    this.nameInteracted.set(false);
    this.innerName.set(this.inputName());
    this.innerDescription.set(this.inputDescription());
    this.mode.set('edit-and-confirm');
  }

  cancelChanges() {
    this.nameInteracted.set(false);
    this.innerName.set(this.inputName());
    this.innerDescription.set(this.inputDescription());
    this.mode.set('view');
  }

  saveChanges() {
    if (this.innerName().trim() === '') {
      this.nameInteracted.set(true);
      return;
    }
    this.inputName.set(this.innerName());
    this.inputDescription.set(this.innerDescription());
    this.mode.set('view');
    this.emitChange();
  }

  markNameInteracted() {
    this.nameInteracted.set(true);
  }

  protected emitChange() {
    this.summaryChange.emit({
      name: this.innerName(),
      description: this.innerDescription(),
    });
  }
}
