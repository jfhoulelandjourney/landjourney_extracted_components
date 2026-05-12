import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
} from '@angular/core';
import { RequestStatuses, StatusFlow } from '../../../models/requestModels';
import * as StringUtil from '../../../utils/stringUtil';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'landjourney-status-flow',
  templateUrl: './status-flow.component.html',
  styleUrls: ['./status-flow.component.scss'],
  imports: [ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusFlowComponent {
  @Input() statusFlow!: StatusFlow;
  @Input() currentStatus!: RequestStatuses;
  @Input() displayedStatus!: string;

  readonly statusClicked = output<string>();

  formatEnumValue(value: string): string {
    return StringUtil.formatEnumValue(value);
  }

  statusWasClicked(status: string) {
    this.statusClicked.emit(status);
  }
}
