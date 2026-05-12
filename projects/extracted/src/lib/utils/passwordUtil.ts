export interface PasswordRequirementsValidation {
  minimum_length?: boolean;
  mixed_casing?: boolean;
  digits?: boolean;
  special_chars?: boolean;
  no_spaces: boolean;
}

export interface PasswordRequirements {
  minimum_length?: string;
  mixed_casing?: string;
  digits?: string;
  special_chars?: string;
  no_spaces: string;
}

export interface PasswordStrengthConfiguration {
  minimum_length?: number;
  mixed_casing?: boolean;
  digits?: boolean;
  special_chars?: boolean;
}

export const DEFAULT_CONFIGURATION: PasswordStrengthConfiguration = {
  minimum_length: 8,
  mixed_casing: true,
  digits: true,
  special_chars: false,
};

export function getPasswordRequirements(
  configuration: PasswordStrengthConfiguration = DEFAULT_CONFIGURATION
): PasswordRequirements {
  const requirements: PasswordRequirements = {
    no_spaces: 'No spaces allowed',
  };

  if (configuration.minimum_length && configuration.minimum_length > 0) {
    requirements.minimum_length = `At least ${configuration.minimum_length} characters long`;
  }

  if (configuration.mixed_casing) {
    requirements.mixed_casing =
      'At least one uppercase letter and one lowercase letter';
  }

  if (configuration.digits) {
    requirements.digits = 'At least one digit';
  }

  if (configuration.special_chars) {
    requirements.special_chars = 'At least one special character (@#$%^&+=!)';
  }

  return requirements;
}

export function isValidPassword(
  password: string,
  configuration: PasswordStrengthConfiguration = DEFAULT_CONFIGURATION
): boolean {
  if (password.includes(' ')) {
    return false;
  }

  if (
    configuration.minimum_length &&
    password.length < configuration.minimum_length
  ) {
    return false;
  }

  if (
    configuration.mixed_casing &&
    (!/[A-Z]/.test(password) || !/[a-z]/.test(password))
  ) {
    return false;
  }

  if (configuration.digits && !/\d/.test(password)) {
    return false;
  }

  if (configuration.special_chars && !/[@#$%^&+=!]/.test(password)) {
    return false;
  }

  return true;
}

export function getPasswordValidationMap(
  password: string,
  configuration: PasswordStrengthConfiguration = DEFAULT_CONFIGURATION
): PasswordRequirementsValidation {
  const requirements: PasswordRequirementsValidation = {
    no_spaces: password !== '',
  };

  if (password.includes(' ')) {
    requirements.no_spaces = false;
  }

  if (configuration.minimum_length) {
    if (password.length < configuration.minimum_length) {
      requirements.minimum_length = false;
    } else {
      requirements.minimum_length = true;
    }
  }

  if (configuration.mixed_casing) {
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      requirements.mixed_casing = false;
    } else {
      requirements.mixed_casing = true;
    }
  }

  if (configuration.digits) {
    if (!/\d/.test(password)) {
      requirements.digits = false;
    } else {
      requirements.digits = true;
    }
  }

  if (configuration.special_chars) {
    if (!/[@#$%^&+=!]/.test(password)) {
      requirements.special_chars = false;
    } else {
      requirements.special_chars = true;
    }
  }

  return requirements;
}
