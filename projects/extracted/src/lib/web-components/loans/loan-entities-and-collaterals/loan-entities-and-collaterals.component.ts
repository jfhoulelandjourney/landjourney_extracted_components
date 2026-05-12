
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { LoanUserBaseSchema } from '../../../services/lending/models/loans.models';
import { MatExpansionModule } from '@angular/material/expansion';
import { CollateralFullOnLoanSchema } from '../../../services/lending/models/collaterals.models';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LoanEntitiesComponent } from '../loan-entities/loan-entities.component';
import { LoanCollateralsComponent } from '../loan-collaterals/loan-collaterals.component';
import { GroupedAvatarComponent } from '../../../design-system/organisms/grouped-avatar/grouped-avatar.component';
import {
  RequestUser,
  RequestUserRoles,
  RequestUserTypes,
} from '../../../models/requestModels';
import { LendingCollateralTypes as CollateralTypes } from '../../../services/lending/models/lending.enums';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-loan-entities-and-collaterals',
  templateUrl: './loan-entities-and-collaterals.component.html',
  styleUrls: ['./loan-entities-and-collaterals.component.scss'],
  imports: [
    MatExpansionModule,
    MatIconModule,
    ActivateDirective,
    LoanEntitiesComponent,
    LoanCollateralsComponent,
    GroupedAvatarComponent
],
})
export class LoanEntitiesAndCollateralsComponent {
  entities = input<LoanUserBaseSchema[]>([]);
  collaterals = input<CollateralFullOnLoanSchema[]>([]);

  panelOpen = signal(false);

  toggle() {
    this.panelOpen.set(!this.panelOpen());
  }

  showCollaterals() {
    return this.collaterals().length > 0;
  }

  getFormattedEntities(): RequestUser[] {
    return (
      this.entities().map(user => ({
        userId: user.userId,
        userType:
          RequestUserTypes.INDIVIDUAL /* not needed for avatar but needed for type */,
        userRole:
          RequestUserRoles.BORROWER /* not needed for avatar but needed for type */,
        profile: {
          avatarUri: user.profile?.avatarUri,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
        },
      })) ?? []
    );
  }

  getFormattedCollaterals(): RequestUser[] {
    return (
      this.collaterals().map(collateral => ({
        userId: collateral.collateralId,
        userType:
          RequestUserTypes.INDIVIDUAL /* not needed for avatar but needed for type */,
        userRole:
          RequestUserRoles.BORROWER /* not needed for avatar but needed for type */,
        profile: {
          avatarUri: this.findCollateralImage(collateral.type),
          firstName: collateral.name,
        },
      })) ?? []
    );
  }

  findCollateralImage(type: CollateralTypes) {
    switch (type) {
      case CollateralTypes.LAND:
        return `/assets/misc/collaterals/land.svg`;
      case CollateralTypes.MACHINERY:
        return `/assets/misc/collaterals/machinery.svg`;
    }

    return undefined;
  }
}
