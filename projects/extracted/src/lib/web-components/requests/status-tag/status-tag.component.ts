import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
} from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import * as StringUtil from '../../../utils/stringUtil';
import { isNonNullable } from '../../../utils/nullishUtil';

export interface Status {
  label: string;
  color: 'gray' | 'green' | 'yellow' | 'red';
}

@Component({
  selector: 'landjourney-status-tag',
  templateUrl: './status-tag.component.html',
  styleUrls: ['./status-tag.component.scss'],
  imports: [MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusTagComponent {
  @Input() text!: string;
  @Input() color: 'gray' | 'green' | 'yellow' | 'red' = 'gray';
  @Input() size: 'large' | 'medium' | 'small' = 'medium';
  @Input() clickable = false;

  @Input() availableStatuses: Status[] | null = null;

  readonly statusChange = output<string>();

  isEditable(): boolean {
    return (
      isNonNullable(this.availableStatuses) && this.availableStatuses.length > 0
    );
  }

  statusClicked(status: string) {
    this.statusChange.emit(status);
  }

  formatEnumValue(value: string): string {
    return StringUtil.formatEnumValue(value);
  }
}
