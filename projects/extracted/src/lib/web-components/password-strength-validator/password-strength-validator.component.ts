import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  DEFAULT_CONFIGURATION,
  getPasswordRequirements,
  getPasswordValidationMap,
  type PasswordStrengthConfiguration,
} from '../../utils/passwordUtil';

@Component({
  selector: 'lj-password-strength-validator',
  imports: [CommonModule, MatIconModule],
  templateUrl: './password-strength-validator.component.html',
  styleUrls: ['./password-strength-validator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthValidatorComponent {
  password = input.required<string>();
  configuration = input<PasswordStrengthConfiguration>(DEFAULT_CONFIGURATION);

  requirements = computed(() => getPasswordRequirements(this.configuration()));
  validationMap = computed(() =>
    getPasswordValidationMap(this.password(), this.configuration())
  );

  requirementsList = computed(() => {
    const requirements = this.requirements();
    const validationMap = this.validationMap();

    return Object.entries(requirements)

      .map(([key, text]) => ({
        key,
        text,
        isValid: validationMap[key as keyof typeof validationMap],
      }));
  });

  getValidationIcon(isValid: boolean | undefined): string {
    if (isValid === undefined) return '';
    return isValid ? 'check_circle' : 'cancel';
  }

  getValidationClass(isValid: boolean | undefined): string {
    if (isValid === undefined) return '';
    return isValid ? 'valid' : 'invalid';
  }
}
