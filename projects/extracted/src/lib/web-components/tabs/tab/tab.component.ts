import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { Tab } from '../tab.models';

@Component({
  selector: 'lj-tab',
  imports: [],
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tab',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.id]': 'name()',
    '[attr.aria-controls]': 'name()',
    '[class.selected]': 'selected()',
  },
})
export class LjTabComponent {
  name = input.required<Tab>();
  disabled = input(false);
  selected = model(false);
}
