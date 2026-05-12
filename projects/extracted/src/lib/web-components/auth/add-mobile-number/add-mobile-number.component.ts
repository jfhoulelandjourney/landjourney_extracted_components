import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  type OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';

import { toMaskitoMask } from '../../../constants/masks';
import {
  formatPhoneNumberForApi,
  is10DigitsValidPhoneNumber,
  phoneNumberMask,
} from '../../../models/phoneNumber';
import {
  CoreUpdateStatuses,
  CoreUpdateTypes,
  type UserProfile,
} from '../../../models/userModels';
import { IAMService } from '../../../services/identity/iam.service';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';

import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LjButtonComponent } from '../../button/button.component';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import { SmsComplianceComponent } from '../../sms-compliance/sms-compliance.component';

type Status = 'INPUT' | 'VERIFY' | 'SUCCESS';

@Component({
  selector: 'lj-add-mobile-number',
  imports: [
    FormsModule,
    MatIconModule,
    SmsComplianceComponent,
    LjInputFieldComponent,
    LjButtonComponent,
    ActivateDirective,
  ],
  templateUrl: './add-mobile-number.component.html',
  styleUrl: './add-mobile-number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class AddMobileNumberComponent implements OnDestroy {
  private iamService = inject(IAMService);
  private uiNotification = inject(UiNotificationService);
  private router = inject(Router);

  phoneNumberMask = toMaskitoMask(phoneNumberMask);

  status = signal<Status>('INPUT');
  phoneNumber = signal('');
  verificationCode = signal('');
  confirmationCheck = signal(false);

  isValid = signal(false);
  errors = signal<string[]>([]);
  timerId: unknown = null;
  timeRemainingInSeconds = signal(0);
  resendingCode = signal(false);

  blurred = signal(false);

  redirect = input<string>();

  isValidPhoneNumber = computed(() => {
    return is10DigitsValidPhoneNumber(
      this.phoneNumber()
        .replaceAll(' ', '')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll('-', '')
        .replaceAll('+1', '')
    );
  });

  isValidVerificationCode = computed(() => {
    return this.verificationCode().replace(/\s/g, '').length === 6;
  });

  canSendCode = computed(() => {
    return this.isValidPhoneNumber() && this.confirmationCheck();
  });

  canVerify = computed(() => {
    return this.isValidVerificationCode();
  });

  validate = effect(
    () => {
      const errors: string[] = [];

      if (this.status() === 'INPUT') {
        if (!this.isValidPhoneNumber()) {
          errors.push('phoneRequired');
        } else if (!this.confirmationCheck()) {
          errors.push('smsComplianceRequired');
        }
      }

      if (this.status() === 'VERIFY') {
        if (!this.isValidVerificationCode()) {
          errors.push('codeNotEntered');
        }
      }

      this.errors.set(errors);
      this.isValid.set(errors.length === 0);
    },
    {
      allowSignalWrites: true,
    }
  );

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId as number);
    }
  }

  hasError(errorName: string) {
    return this.errors().includes(errorName);
  }

  startCountDown() {
    this.timeRemainingInSeconds.set(60); // 1 minute
    this.timerId = setInterval(() => {
      const remaining = this.timeRemainingInSeconds() - 1;
      this.timeRemainingInSeconds.set(remaining);
      if (remaining <= 0 && this.timerId) {
        clearInterval(this.timerId as number);
      }
    }, 1000);
  }

  getMaskedPhoneNumber(): string {
    const phone = this.phoneNumber();
    if (phone.length < 10) return phone;

    const digits = phone.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `(XXX-XXX-${lastFour})`;
  }

  sendVerificationCode() {
    if (!this.canSendCode()) return;

    const formattedPhone = formatPhoneNumberForApi(this.phoneNumber());

    this.iamService
      .initiateCoreUpdate({
        coreUpdateType: CoreUpdateTypes.PHONE,
        newValue: formattedPhone,
      })
      .subscribe({
        next: response => {
          if (response.status === CoreUpdateStatuses.USER_ALREADY_EXISTS) {
            this.uiNotification.showSnackbar(
              'This phone number is already registered.',
              'red'
            );
          } else {
            this.startCountDown();
            this.status.set('VERIFY');
          }
        },
        error: () => {
          this.uiNotification.showSnackbar(
            'Failed to send verification code. Please try again.',
            'red'
          );
        },
      });
  }

  resendCode() {
    if (this.resendingCode()) return;

    this.resendingCode.set(true);
    this.verificationCode.set('');

    const formattedPhone = formatPhoneNumberForApi(this.phoneNumber());

    this.iamService
      .initiateCoreUpdate({
        coreUpdateType: CoreUpdateTypes.PHONE,
        newValue: formattedPhone,
      })
      .subscribe({
        next: () => {
          this.startCountDown();
          this.resendingCode.set(false);
          this.uiNotification.showSnackbar(
            'Verification code resent successfully.',
            'green'
          );
        },
        error: () => {
          this.resendingCode.set(false);
          this.uiNotification.showSnackbar(
            'Failed to resend verification code. Please try again.',
            'red'
          );
        },
      });
  }

  getFormatedTime() {
    const timeRemaining = this.timeRemainingInSeconds();
    if (timeRemaining > 60) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      return `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    return `${timeRemaining} seconds`;
  }

  verify() {
    if (!this.canVerify()) return;

    const formattedPhone = formatPhoneNumberForApi(this.phoneNumber());

    this.iamService
      .executeCoreUpdate({
        newValue: formattedPhone,
        code: this.verificationCode().replace(/\s/g, ''),
      })
      .subscribe({
        next: newToken => {
          this.iamService.setToken(newToken);
          this.iamService.refreshToken();
          this.iamService.getOwnProfile().subscribe({
            next: (user: UserProfile) => {
              this.iamService.setActiveUser(user, true);
            },
          });
          this.status.set('SUCCESS');
        },
        error: () => {
          this.uiNotification.showSnackbar(
            'The provided code was not valid or was expired.',
            'red',
            undefined,
            'X'
          );
        },
      });
  }

  continue() {
    if (this.redirect()) {
      this.router.navigateByUrl(this.redirect() ?? '', { state: {} });
    } else {
      this.iamService.redirectAfterLogin('/home');
    }
  }
}
