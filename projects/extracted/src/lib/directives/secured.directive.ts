import { Directive, HostBinding, Input, OnInit, inject } from '@angular/core';
import { Actions, Resources } from '../models/organizationModels';
import { IAMService } from '../services/identity/iam.service';
import { PermissionUtil } from '../utils/permissionUtil';
import { SystemGroups } from '../models/authModels';

@Directive({
  selector: '[lj-secured]',
  standalone: true,
})
export class SecuredDirective implements OnInit {
  private iamService = inject(IAMService);

  @Input() organizationId!: string;
  @Input() resource?: string;
  @Input() action?: 'DENY' | 'LIST' | 'READ' | 'UPDATE' | 'CREATE' | 'DELETE';
  @Input() group?:
    | 'ORGANIZATION OWNER'
    | 'LOAN OFFICER'
    | 'CUSTOMERS'
    | 'EMPLOYEES';

  actionMapping = {
    DENY: Actions.DENY,
    LIST: Actions.LIST,
    READ: Actions.READ,
    UPDATE: Actions.UPDATE,
    CREATE: Actions.CREATE,
    DELETE: Actions.DELETE,
  };

  @HostBinding('class.hide-element') hideElement = true;

  ngOnInit() {
    if (this.group) {
      if (
        PermissionUtil.isInGroup(
          this.iamService.getUserGroups(this.organizationId),
          this.group as SystemGroups
        )
      ) {
        this.hideElement = false;
      }
    } else {
      if (
        this.action &&
        PermissionUtil.isAuthorized(
          this.iamService.getUserPermissions(this.organizationId),
          this.resource as Resources,
          this.actionMapping[this.action]
        )
      ) {
        this.hideElement = false;
      }
    }
  }
}
