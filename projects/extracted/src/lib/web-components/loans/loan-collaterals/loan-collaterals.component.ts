
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AvatarComponent } from '../../../design-system/molecules/avatar/avatar.component';
import {
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
} from '../../../models/requestModels';
import { SharedViewUserProfile } from '../../../models/userModels';
import { CollateralFullOnLoanSchema } from '../../../services/lending/models/collaterals.models';
import { LendingCollateralTypes as CollateralTypes } from '../../../services/lending/models/lending.enums';
import { getProfileFromRequestUser } from '../../../utils/entityUtil';
import { formatAcres, formatAmountFromCents } from '../../../utils/numberUtil';
import { getFormattedEnumValue } from '../../../utils/stringUtil';
import { readableDateFromTimestamp } from '../../../utils/timeUtil';
import { BoxRowComponent } from '../../box/box-row/box-row.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-collaterals',
  templateUrl: './loan-collaterals.component.html',
  styleUrls: ['./loan-collaterals.component.scss'],
  imports: [BoxRowComponent, AvatarComponent],
})
export class LoanCollateralsComponent {
  formatDate = readableDateFromTimestamp;
  formatAmount(value?: number) {
    return formatAmountFromCents(value, {
      zeroFormat: formatter => formatter(0),
    });
  }
  formatAcres = formatAcres;
  getFormattedEnumValue = getFormattedEnumValue;
  collaterals = input<CollateralFullOnLoanSchema[]>();

  findCollateralImage(type: CollateralTypes) {
    switch (type) {
      case CollateralTypes.LAND:
        return `/assets/misc/collaterals/land.svg`;
      case CollateralTypes.MACHINERY:
        return `/assets/misc/collaterals/machinery.svg`;
    }

    return undefined;
  }

  getCollateralsForAvatar(collateral: CollateralFullOnLoanSchema): RequestUser {
    return {
      userId: collateral.collateralId,
      userType:
        RequestUserTypes.INDIVIDUAL /* not needed for avatar but needed for type */,
      userRole:
        RequestUserRoles.BORROWER /* not needed for avatar but needed for type */,
      profile: {
        avatarUri: this.findCollateralImage(collateral.type),
        firstName: collateral.name,
      },
    };
  }

  getProfile(user: RequestUser): SharedViewUserProfile {
    if (!user) {
      return {};
    }

    return getProfileFromRequestUser(user);
  }
}
