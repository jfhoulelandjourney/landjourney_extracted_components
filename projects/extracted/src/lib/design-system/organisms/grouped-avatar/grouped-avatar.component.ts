
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AvatarComponent } from '../../molecules/avatar/avatar.component';
import { RequestUser, Request } from '../../../models/requestModels';
import {
  computedEntityStatusForRequest,
  getAliasesForEntity,
  mapEntityStatusToColor,
} from '../../../utils/requestUtils/entity-status';

import { SharedViewUserProfile } from '../../../models/userModels';
import { getProfileFromRequestUser } from '../../../utils/entityUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-grouped-avatar',
  templateUrl: './grouped-avatar.component.html',
  styleUrls: ['./grouped-avatar.component.scss'],
  imports: [AvatarComponent],
})
export class GroupedAvatarComponent {
  entities = input.required<RequestUser[]>();
  request = input<Request | undefined>();

  getAvatarStatusColor(entity: RequestUser): string {
    const aliases = getAliasesForEntity(
      this.request()?.users ?? [],
      entity.userId ?? ''
    );
    const status = computedEntityStatusForRequest(this.request(), aliases);
    return mapEntityStatusToColor(status);
  }

  getProfile(user: RequestUser): SharedViewUserProfile {
    return getProfileFromRequestUser(user);
  }
}
