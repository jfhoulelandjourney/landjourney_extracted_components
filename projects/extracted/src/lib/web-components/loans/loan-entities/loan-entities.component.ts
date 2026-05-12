
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AvatarComponent } from '../../../design-system/molecules/avatar/avatar.component';
import { UserRoles } from '../../../services/lending/models/lending.enums';
import { LoanUserBaseSchema } from '../../../services/lending/models/loans.models';
import { isUserCollaborator } from '../../../utils/loanUtil';
import { getFormattedEnumValue } from '../../../utils/stringUtil';
import { BoxRowComponent } from '../../box/box-row/box-row.component';
import { getDisplayNameFromProfile } from '../../../utils/entityUtil';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-entities',
  templateUrl: './loan-entities.component.html',
  styleUrls: ['./loan-entities.component.scss'],
  imports: [AvatarComponent, BoxRowComponent],
})
export class LoanEntitiesComponent {
  formatEntityName = getDisplayNameFromProfile;

  getFormattedEnumValue = getFormattedEnumValue;
  entities = input<LoanUserBaseSchema[]>();

  getLoanMainBorrowers() {
    return (this.entities() ?? []).filter(
      user => user.role === UserRoles.BORROWER
    );
  }

  getLoanCoBorrowers() {
    return (this.entities() ?? []).filter(
      user => user.role === UserRoles.CO_BORROWER
    );
  }

  getLoanGuarantors() {
    return (this.entities() ?? []).filter(
      user => user.role === UserRoles.GUARANTOR
    );
  }

  getLoanCollaborators() {
    return (this.entities() ?? []).filter(isUserCollaborator);
  }
}
