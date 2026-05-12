
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, timer } from 'rxjs';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import type { Request } from '../../../../models/requestModels';
import { TaskStatuses, type Section } from '../../../../models/sectionModels';
import { ClientRequestsService } from '../../../../services/client/requests/client-requests.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-identity-success',
  templateUrl: './identity-success.component.html',
  styleUrls: ['./identity-success.component.scss'],
  imports: [MatIconModule, ActivateDirective],
})
export class IdentitySuccessComponent implements OnInit {
  readonly clientRequestsService = inject(ClientRequestsService);

  alreadyVerified = input(false);
  isMobile = input(false);
  name = input.required<string>();
  request = input.required<Request>();
  section = input.required<Section>();
  readonly next = output();

  ngOnInit() {
    timer(500)
      .pipe(
        switchMap(() =>
          this.clientRequestsService.uploadFilesToSection(
            this.request(),
            this.section(),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.section().tasks[0]!,
            (this.section().tasks[0]?.attachments ?? []).map(attachment => ({
              ...attachment,
              status: TaskStatuses.APPROVED,
            }))
          )
        )
      )
      .subscribe({});
  }
}
