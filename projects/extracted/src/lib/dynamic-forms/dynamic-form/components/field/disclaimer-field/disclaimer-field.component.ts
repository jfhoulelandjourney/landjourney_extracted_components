import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxPrintModule } from 'ngx-print';
import { AvatarComponent } from '../../../../../design-system/molecules/avatar/avatar.component';
import { FieldDirective } from '../../../../../directives/field.directive';
import { SafeHtmlPipe } from '../../../../../pipes/safe-html/safe-html.pipe';
import { IAMService } from '../../../../../services/identity/iam.service';
import {
  readableDateFromTimestamp,
  TimeUtil,
} from '../../../../../utils/timeUtil';
import {
  getDefaultDisclaimerFieldValue,
  type DisclaimerFieldModel,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';
import { AbstractFieldComponent } from '../../abstract-field.component';

@Component({
  selector: 'lj-df-disclaimer-field',
  imports: [
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    NgxPrintModule,
    MatIconModule,
    MatButtonModule,
    SafeHtmlPipe,
    AvatarComponent,
  ],
  templateUrl: './disclaimer-field.component.html',
  styleUrl: './disclaimer-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: DisclaimerFieldComponent },
  ],
})
export class DisclaimerFieldComponent
  extends AbstractFieldComponent<DisclaimerFieldModel>
  implements OnInit
{
  private iamService = inject(IAMService);
  ngOnInit() {
    if (
      this.field() &&
      (!this.field().value || !('disclaimer' in (this.field().value ?? {})))
    ) {
      this.field().value = getDefaultDisclaimerFieldValue();
    }

    if (
      (this.mode() === 'display' && this.field().value !== undefined) ||
      this.field().value !== null
    ) {
      if (this.field().value?.disclaimerAccepted === undefined) {
        // If disclaimerAccepted is not set, initialize it to false
        this.field().value = {
          disclaimerTitle: this.field().value?.disclaimerTitle || '',
          disclaimer: this.field().value?.disclaimer || '',
          disclaimerAccepted: false,
          showAcceptButton: true,
        };
      }
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const value = this.field().value;

    if (!value?.showAcceptButton) {
      return undefined;
    }

    if (!value?.disclaimerAccepted) {
      return ValidationErrorKey.REQUIRED;
    }

    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);
    const value = this.field().value;

    if (
      this.mode() === 'display' &&
      value &&
      value.showAcceptButton === false &&
      !value.disclaimerAccepted
    ) {
      this.handleDisclaimerAcceptedChange(true);
    }

    return this.getErrorKey() === undefined;
  }

  formatAcceptedDate(timestamp: number): string {
    return readableDateFromTimestamp(timestamp, 'long');
  }

  handleDisclaimerAcceptedChange(value: boolean) {
    const field = this.field();

    this.touched.set(true);

    const oldValue = field.value ? field.value.disclaimerAccepted : undefined;

    if (!field.value || oldValue === undefined) {
      return;
    }

    field.value.disclaimerAccepted = value;

    if (value) {
      const currentUser = this.iamService.getActiveUser();
      field.value.acceptedByName =
        currentUser?.firstName + ' ' + currentUser?.lastName;
      field.value.acceptedByAvatarUri = currentUser?.avatarUri;
      field.value.acceptedAt = TimeUtil.convertDateToSecondTimestamp(
        new Date()
      );
    } else {
      field.value.acceptedByName = undefined;
      field.value.acceptedByAvatarUri = undefined;
      field.value.acceptedAt = undefined;
    }

    if (value !== oldValue) {
      this.dataChange.emit(field);
    }
  }
}
