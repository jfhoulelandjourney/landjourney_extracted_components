import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import {
  getMoneyMaskitoOptions,
  numberMaskitoMask,
} from '../../../../../constants/masks';
import { FieldDirective } from '../../../../../directives/field.directive';
import { formatEnumValue } from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LjSelectFieldComponent } from '../../../../../web-components/form/select-field/select-field.component';
import {
  LivestockDetailsFieldModel,
  LivestockTypes,
} from '../../../../models/fields.models';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { EditableInputComponent } from '../../configuration/editable-input/editable-input.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';

@Component({
  selector: 'lj-df-livestock-details',
  imports: [
    MatIconModule,
    LjButtonComponent,
    LjInputFieldComponent,
    FormsModule,
    MatButtonModule,
    LjSelectFieldComponent,
    EditableInputComponent,
    ConditionalLogicComponent,
    FieldConfigurationComponent,
  ],
  templateUrl: './livestock-details.component.html',
  styleUrl: './livestock-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: LivestockDetailsComponent },
  ],
})
export class LivestockDetailsComponent extends AbstractFieldComponent<
  LivestockDetailsFieldModel[]
> {
  moneyMask: MaskitoOptions = getMoneyMaskitoOptions('livestock-details');
  numberMask: MaskitoOptions = numberMaskitoMask();

  editedLivestock = model<LivestockDetailsFieldModel>(
    this.getDefaultLiveStock()
  );
  nonEditedLivestock = model<LivestockDetailsFieldModel>(
    this.getDefaultLiveStock()
  );

  liveStockTypes = Object.values(LivestockTypes).map(item => {
    return { label: formatEnumValue(item as string), value: item };
  });

  getDefaultLiveStock(): LivestockDetailsFieldModel {
    return {
      typeOfLiveStock: LivestockTypes.BEEF_CATTLE,
      typeOfOperation: 'Type',
      otherDetails: '',
      herdSize: 1520,
      averageSaleQuantity: '100 cows',
      averageSalePricePerHead: 3500,
      averageHeadSoldPerYear: 250,
      integratorOrMarketerName: '',
      comments: '',
    };
  }

  formatMoney(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(`${number}`, this.moneyMask);
  }

  formatNumber(number: number): string {
    if (number === 0) {
      return '';
    }
    return maskitoTransform(`${number}`, this.numberMask);
  }

  formatEnumValue(value: string) {
    return formatEnumValue(value);
  }
}
