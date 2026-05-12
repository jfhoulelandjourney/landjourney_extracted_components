import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { toMaskitoMask } from '../../../../../../constants/masks';
import { ActivateDirective } from '../../../../../../directives/activate/activate.directive';
import {
  isPhoneNumber,
  phoneNumberMask,
} from '../../../../../../models/phoneNumber';
import { RequestUserTypes } from '../../../../../../models/requestModels';
import {
  formatEnumValue,
  isValidEmail,
} from '../../../../../../utils/stringUtil';
import { LjInputFieldComponent } from '../../../../../../web-components/form/input-field/input-field.component';

import type { BorrowerModel } from '../../../../../models/fields.models';
import {
  CssRootNode,
  getCustomStyleString,
} from '../../../../../utilities/dynamicFormsUtil';

@Component({
  selector: 'lj-df-borrower-information',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    LjInputFieldComponent,
    ActivateDirective,
    MatRadioModule,
    MatSelectModule,
  ],
  templateUrl: './borrower-information.component.html',
  styleUrl: './borrower-information.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BorrowerInformationComponent implements OnInit {
  borrower = input.required<BorrowerModel>();
  showDelete = input<boolean>(true);
  locked = input<boolean>(false);
  customStyle = input.required<CssRootNode>();
  style = input<'gray' | 'normal'>('gray');
  position = input<number | undefined>(undefined);

  phoneNumberMask = toMaskitoMask(phoneNumberMask);

  firstNameTouched = signal(false);
  lastNameTouched = signal(false);
  emailTouched = signal(false);
  phoneTouched = signal(false);
  businessNameTouched = signal(false);
  businessTypeTouched = signal(false);

  phoneIsRequired = signal<boolean>(false);
  emailIsRequired = signal<boolean>(false);

  readonly borrowerChange = output<BorrowerModel>();
  readonly remove = output<BorrowerModel>();

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

  ngOnInit() {
    this.borrower().isBusiness = this.borrower().isBusiness ?? false;
  }

  getCustomStyle(selector: string, defaultStyle = '') {
    return (
      getCustomStyleString(selector, this.customStyle(), true) ?? defaultStyle
    );
  }

  isValid(): boolean {
    this.firstNameTouched.set(true);
    this.lastNameTouched.set(true);
    this.emailTouched.set(true);
    this.phoneTouched.set(true);
    this.businessNameTouched.set(true);
    this.businessTypeTouched.set(true);

    return (
      this.getFirstNameErrorMessage() === undefined &&
      this.getLastNameErrorMessage() === undefined &&
      this.getPhoneErrorMessage() === undefined &&
      this.getEmailErrorMessage() === undefined &&
      this.getBusinessNameErrorMessage() === undefined &&
      this.getBusinessTypeErrorMessage() === undefined
    );
  }

  handleBusinessNameChange(value: string) {
    const borrower = this.borrower();

    if (borrower.businessName !== value) {
      this.handleChange({
        ...borrower,
        businessName: value,
      });
    }
  }

  handleBusinessTypeChange(value: string) {
    const borrower = this.borrower();

    if (borrower.businessType !== value) {
      this.handleChange({
        ...borrower,
        businessType: value as RequestUserTypes,
      });
    }
  }

  handleFirstNameChange(value: string) {
    const borrower = this.borrower();

    if (borrower.firstName !== value) {
      this.handleChange({
        ...borrower,
        firstName: value,
      });
    }
  }

  getBusinessNameErrorMessage(): string | undefined {
    if (!this.borrower().isBusiness) {
      return undefined;
    }

    if (
      !this.borrower().businessName ||
      this.borrower().businessName?.trim() === ''
    ) {
      return 'This field is required';
    }

    if (
      this.borrower().businessName &&
      (this.borrower().businessName?.trim() ?? '').length < 3
    ) {
      return 'Minimum length is 3';
    }

    return undefined;
  }

  getBusinessTypeErrorMessage(): string | undefined {
    if (!this.borrower().isBusiness) {
      return undefined;
    }

    if (
      !this.borrower().businessType ||
      this.borrower().businessType?.trim() === ''
    ) {
      return 'This field is required';
    }

    return undefined;
  }

  handleOnBlurBusinessName() {
    this.businessNameTouched.set(true);
  }

  getFirstNameErrorMessage(): string | undefined {
    if (this.borrower().firstName.trim() === '') {
      return 'This field is required';
    }

    if (this.borrower().firstName.trim().length < 3) {
      return 'Minimum length is 3';
    }

    return undefined;
  }

  handleOnBlurFirstName() {
    this.firstNameTouched.set(true);
  }

  handleLastNameChange(value: string) {
    const borrower = this.borrower();

    if (borrower.lastName !== value) {
      this.handleChange({ ...borrower, lastName: value });
    }
  }

  getLastNameErrorMessage(): string | undefined {
    if (this.borrower().lastName.trim() === '') {
      return 'This field is required';
    }

    if (this.borrower().lastName.trim().length < 3) {
      return 'Minimum length is 3';
    }

    return undefined;
  }

  handleOnBlurLastName() {
    this.lastNameTouched.set(true);
  }

  handlePhoneChange(value: string) {
    const borrower = this.borrower();

    this.emailIsRequired.set(!isPhoneNumber(borrower.phone));

    if (borrower.phone !== value) {
      this.handleChange({ ...borrower, phone: value });
    }
  }

  getPhoneErrorMessage(): string | undefined {
    if (
      isValidEmail(this.borrower().email) &&
      (!this.borrower().phone || this.borrower().phone.trim() === '')
    ) {
      return undefined;
    }

    if (this.borrower().phone.trim() === '') {
      return 'This field is required';
    }

    if (!isPhoneNumber(this.borrower().phone)) {
      return 'This phone number is not valid';
    }

    return undefined;
  }

  handleOnBlurPhone() {
    this.phoneTouched.set(true);
  }

  handleEmailChange(value: string) {
    const borrower = this.borrower();
    const trimmed = (value ?? '').trim();

    this.phoneIsRequired.set(!isValidEmail(borrower.email));

    if (borrower.email !== trimmed) {
      this.handleChange({ ...borrower, email: trimmed });
    }
  }

  getEmailErrorMessage(): string | undefined {
    if (
      isPhoneNumber(this.borrower().phone) &&
      (!this.borrower().email || this.borrower().email.trim() === '')
    ) {
      return undefined;
    }

    if (this.borrower().email.trim() === '') {
      return 'This field is required';
    }

    if (!isValidEmail(this.borrower().email)) {
      return 'This email is not valid';
    }

    return undefined;
  }

  handleOnBlurEmail() {
    this.emailTouched.set(true);
  }

  handleChange(value: BorrowerModel) {
    this.borrowerChange.emit(value);
  }
}
