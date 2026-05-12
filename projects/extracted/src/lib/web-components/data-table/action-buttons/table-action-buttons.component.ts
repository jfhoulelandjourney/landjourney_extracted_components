
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TIMING } from '../../../constants/timing';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { DataTableService } from '../service/data-table.service';

const actionButtons = [
  'view',
  'edit',
  'delete',
  'copy',
  'remove',
  'configure',
] as const;
export type ActionButton = (typeof actionButtons)[number];

@Component({
  selector: 'lj-table-action-buttons',
  imports: [ActivateDirective, MatButtonModule, MatIconModule],
  templateUrl: './table-action-buttons.component.html',
  styleUrl: './table-action-buttons.component.scss',
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class DataTableActionButtonsComponent<T extends object> {
  timing = inject(TIMING);
  dataTableService = inject(DataTableService);

  data = input.required<T>();
  buttons = input<ActionButton[]>(['edit', 'delete']);
  disabled = input<ActionButton[]>([]);

  readonly validButtons = computed(() => {
    const buttons = this.buttons() ?? [];
    return buttons
      .filter(button => {
        return actionButtons.includes(button);
      })
      .map(button => ({
        name: button,
        disabled: this.disabled().includes(button),
      }));
  });

  readonly delete = output<T>();
  readonly edit = output<T>();
  readonly copy = output<T>();
  readonly remove = output<T>();
  readonly configure = output<T>();
  readonly view = output<T>();

  emitAction(event: Event, button: ActionButton) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    this[button].emit(this.data());
    this.dataTableService.customAction.next({
      action: button,
      value: this.data(),
    });
  }

  getIcon(button: ActionButton) {
    switch (button) {
      case 'edit':
        return 'edit';
      case 'delete':
        return 'delete';
      case 'copy':
        return 'file_copy';
      case 'view':
        return 'visibility';
      case 'remove':
        return 'close';
      case 'configure':
        return 'settings';
    }
  }
}
