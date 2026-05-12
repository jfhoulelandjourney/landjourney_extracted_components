import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { type Section } from '../../../../models/sectionModels';
import type { ClientRequest } from '../../../../services/client/requests/client-requests.service';
import { isSectionInTodo } from '../../../../utils/requestUtils/section-status';
import { BoxComponent } from '../../../box/box/box.component';

@Component({
  selector: 'lj-request-submission-awaiting-others',
  imports: [MatIcon, BoxComponent],
  templateUrl: './request-submission-awaiting-others.component.html',
  styleUrl: './request-submission-awaiting-others.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestSubmissionAwaitingOthersComponent {
  readonly request = input.required<ClientRequest>();
  readonly currentUserId = input.required<string>();

  readonly otherUsersTasks = computed(() => {
    const request = this.request();
    const currentUserId = this.currentUserId();

    if (!request?.sections) {
      return { todoCount: 0 };
    }

    let todoCount = 0;

    // Get sections assigned to other users
    const otherUsersSections = request.sections.filter(
      (section: Section) =>
        section.assigneeId && section.assigneeId !== currentUserId
    );

    for (const section of otherUsersSections) {
      if (isSectionInTodo(section)) {
        todoCount++;
      }
    }

    return { todoCount };
  });
}
