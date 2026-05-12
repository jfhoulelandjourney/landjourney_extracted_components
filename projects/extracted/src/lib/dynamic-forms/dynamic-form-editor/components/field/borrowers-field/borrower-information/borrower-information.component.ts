import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RequestUserTypes } from '../../../../../../models/requestModels';
import { formatEnumValue } from '../../../../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../../../../../web-components/form/input-field/input-field.component';
import type { BorrowerModel } from '../../../../../models/fields.models';

@Component({
  selector: 'lj-df-borrower-information',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    LjInputFieldComponent,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './borrower-information.component.html',
  styleUrl: './borrower-information.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorrowerInformationComponent {
  borrower = input.required<BorrowerModel>();
  position = input<number | undefined>(undefined);

  entityTypes = [
    {
      label: formatEnumValue(RequestUserTypes.CORPORATION),
      description: '',
      value: RequestUserTypes.CORPORATION,
    },
    {
      label: formatEnumValue(RequestUserTypes.SOLE_PROPRIETORSHIP),
      description: '',
      value: RequestUserTypes.SOLE_PROPRIETORSHIP,
    },
    {
      label: RequestUserTypes.LLC,
      description: '',
      value: RequestUserTypes.LLC,
    },
    {
      label: RequestUserTypes.LLP,
      description: '',
      value: RequestUserTypes.LLP,
    },
    {
      label: RequestUserTypes.GP,
      description: '',
      value: RequestUserTypes.GP,
    },
    {
      label: RequestUserTypes.LP,
      description: '',
      value: RequestUserTypes.LP,
    },
    {
      label: formatEnumValue(RequestUserTypes.TRUST),
      description: '',
      value: RequestUserTypes.TRUST,
    },
    {
      label: formatEnumValue(RequestUserTypes.ESTATE),
      description: '',
      value: RequestUserTypes.ESTATE,
    },
  ] as const;
}
