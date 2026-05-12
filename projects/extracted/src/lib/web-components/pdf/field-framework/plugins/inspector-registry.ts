import type { Type } from '@angular/core';
import type { RegisteredFieldType } from './field-plugin';
import { SignatureInspectorComponent } from './signature/signature.inspector';
import { InitialsInspectorComponent } from './initials/initials.inspector';
import { DateInspectorComponent } from './date/date.inspector';
import { NameInspectorComponent } from './name/name.inspector';
import { NumberInspectorComponent } from './number/number.inspector';
import { CurrencyInspectorComponent } from './currency/currency.inspector';
import { DropdownInspectorComponent } from './dropdown/dropdown.inspector';
import { TextInputInspectorComponent } from './text-input/text-input.inspector';
import { TextareaInspectorComponent } from './textarea/textarea.inspector';
import { CheckboxInspectorComponent } from './checkbox/checkbox.inspector';
import { RadioInspectorComponent } from './radio/radio.inspector';

/**
 * Registry mapping field types to their inspector components.
 * Each field type has a corresponding component for inspecting and interacting with that field.
 */
export const INSPECTOR_REGISTRY: Record<RegisteredFieldType, Type<object>> = {
  signature:    SignatureInspectorComponent,
  initials:     InitialsInspectorComponent,
  date:         DateInspectorComponent,
  name:         NameInspectorComponent,
  number:       NumberInspectorComponent,
  currency:     CurrencyInspectorComponent,
  dropdown:     DropdownInspectorComponent,
  'text-input': TextInputInspectorComponent,
  textarea:     TextareaInspectorComponent,
  checkbox:     CheckboxInspectorComponent,
  radio:        RadioInspectorComponent,
};
