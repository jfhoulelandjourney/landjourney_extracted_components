
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LjButtonComponent } from '../../button/button.component';
import { LjRoundHeaderChipComponent } from '../../chip/lj-round-header-chip/lj-round-header-chip.component';
import { LjInputFieldComponent } from '../../form/input-field/input-field.component';
import {
  LjSelectFieldComponent,
  SelectOption,
} from '../../form/select-field/select-field.component';
import { CheckboxFieldComponent } from '../../form/checkbox-field/checkbox-field.component';
import { CreditLineHeaderComponent } from '../credit-line-header/credit-line-header.component';
import { DetailedCreditLineCompoundSchema } from '../../../services/lending/models/credit-lines.models';
import { UiNotificationService } from '../../../services/notifications/ui-notification.service';

@Component({
  selector: 'lj-credit-line-update-bank-account',
  imports: [
    FormsModule,
    MatExpansionModule,
    MatIconModule,
    ActivateDirective,
    LjButtonComponent,
    LjRoundHeaderChipComponent,
    LjInputFieldComponent,
    LjSelectFieldComponent,
    CheckboxFieldComponent,
    CreditLineHeaderComponent
],
  templateUrl: './credit-line-update-bank-account.component.html',
  styleUrl: './credit-line-update-bank-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditLineUpdateBankAccountComponent {
  private uiNotificationService = inject(UiNotificationService);

  creditLine = input<DetailedCreditLineCompoundSchema | undefined>();

  // Success state
  showSuccess = signal<boolean>(false);

  // Demo-only: current bank account info (redacted)
  currentBankName = 'Chase Bank';
  currentAccountMask = '•••• •••• ••4321';
  currentRoutingMask = '••• •••• 210';

  // Form model
  accountHolderName: string | null = null;
  bankName: string | null = null;
  accountType: 'Checking' | 'Savings' | null = null;
  routingNumber: string | null = null;
  accountNumber: string | null = null;
  confirmAccountNumber: string | null = null;
  autoDebit = signal<boolean>(false);

  readonly accountTypeOptions: SelectOption<string>[] = [
    { label: 'Checking', value: 'Checking' },
    { label: 'Savings', value: 'Savings' },
  ];

  isFormValid(): boolean {
    return (
      Boolean(this.accountHolderName) &&
      Boolean(this.accountType) &&
      Boolean(this.routingNumber) &&
      (this.routingNumber?.replace(/\D/g, '') ?? '').length === 9 &&
      Boolean(this.accountNumber) &&
      Boolean(this.confirmAccountNumber) &&
      this.accountNumber === this.confirmAccountNumber
    );
  }

  saveDemo(): void {
    this.uiNotificationService.showSnackbar(
      'Bank account updated (Demo only)',
      'green',
      3000
    );
    this.showSuccess.set(true);
  }
}
