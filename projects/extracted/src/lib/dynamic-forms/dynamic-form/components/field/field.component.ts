import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isString } from 'es-toolkit';
import { ActivateDirective } from '../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../directives/field.directive';
import { EnvironmentService } from '../../../../services/environment/environment.service';
import { OrganizationService } from '../../../../services/organization/organization.service';
import {
  isDate,
  isEqual,
  isNumber,
  isPrimitiveType,
  isUndefinedOrNull,
} from '../../../../utils/comparisonUtil';
import { TimeUtil } from '../../../../utils/timeUtil';
import { LjButton2Component } from '../../../../web-components/button2/button.component';
import {
  DynamicFormData,
  DynamicFormField,
  DynamicFormFieldTypes,
  FormModes,
  FormTypes,
  SectionLayouts,
} from '../../../models/dynamic-forms.models';
import type {
  BorrowersFieldModel,
  CropDetailsFieldModel,
  DisclaimerFieldModel,
  FileUploadFieldModel,
  LivestockDetailsFieldModel,
  LoanInformationFieldModel,
  LoanPurposeFieldModel,
  LoanSourceFieldModel,
  NoteFieldModel,
  OnScreenApprovalFieldModel,
  QuestionnaireFieldModel,
  RepeatableCardFieldModel,
  UseOfFundsFieldModel,
} from '../../../models/fields.models';
import { CssRootNode } from '../../../utilities/dynamicFormsUtil';
import type { ValidationErrorKey } from '../../../utilities/validation-errors.util';
import {
  AbstractFieldComponent,
  FieldCustomAction,
} from '../abstract-field.component';
import { SubmitButtonComponent } from '../buttons/submit-button/submit-button.component';
import { BorrowersFieldComponent } from './borrowers-field/borrowers-field.component';
import { CheckboxFieldComponent } from './checkbox-field/checkbox-field.component';
import { ComputedFieldComponent } from './computed-field/computed-field.component';
import { CropDetailsComponent } from './crop-details/crop-details.component';
import { DateFieldComponent } from './date-field/date-field.component';
import { DisclaimerFieldComponent } from './disclaimer-field/disclaimer-field.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { InputFieldComponent } from './input-field/input-field.component';
import { LivestockDetailsComponent } from './livestock-details/livestock-details.component';
import { LoanInformationFieldComponent } from './loan-information-field/loan-information-field.component';
import { LoanPurposeFieldComponent } from './loan-purpose-field/loan-purpose-field.component';
import { LoanSourcesFieldComponent } from './loan-sources-field/loan-sources-field.component';
import { MoneyFieldComponent } from './money-field/money-field.component';
import { NoteFieldComponent } from './note-field/note-field.component';
import { NumberFieldComponent } from './number-field/number-field.component';
import { OnScreenApprovalComponent } from './on-screen-approval/on-screen-approval.component';
import { QuestionnaireFieldComponent } from './questionnaire-field/questionnaire-field.component';
import { RadioFieldComponent } from './radio-field/radio-field.component';
import { RepeatableCardFieldComponent } from './repeatable-card-field/repeatable-card-field.component';
import { SelectFieldComponent } from './select-field/select-field.component';
import { TextFieldComponent } from './text-field/text-field.component';
import { UseOfFundsComponent } from './use-of-funds/use-of-funds.component';

@Component({
  selector: 'lj-df-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
  imports: [
    InputFieldComponent,
    ComputedFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    MoneyFieldComponent,
    NumberFieldComponent,
    RadioFieldComponent,
    SelectFieldComponent,
    TextFieldComponent,
    LoanInformationFieldComponent,
    LoanPurposeFieldComponent,
    LoanSourcesFieldComponent,
    BorrowersFieldComponent,
    DisclaimerFieldComponent,
    QuestionnaireFieldComponent,
    SubmitButtonComponent,
    FileUploadComponent,
    CropDetailsComponent,
    UseOfFundsComponent,
    RepeatableCardFieldComponent,
    LivestockDetailsComponent,
    NoteFieldComponent,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    LjButton2Component,
    ActivateDirective,
    OnScreenApprovalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent implements OnInit {
  private readonly env = inject(EnvironmentService);
  protected readonly organizationService = inject(OrganizationService);
  protected readonly isBackoffice = this.env.getAppType() === 'backoffice';

  mode = input<FormModes>('display');
  isMobile = input(false);
  field = input.required<DynamicFormField<unknown>>();
  formData = input.required<DynamicFormData>();
  formType = input.required<FormTypes>();
  formTypes = FormTypes;
  containerLayout = input.required<SectionLayouts>();
  customStyle = input<CssRootNode>({ parent: null, children: [] });
  style = input<'gray' | 'normal'>('gray');
  allowManualComputedValueEdit = input(false);
  suppressedErrorKeys = input<string[]>([]);
  fieldValidity = input<Record<string, string | undefined>>({});
  prefillPendingChanges = input<Record<string, unknown>>({});
  readonly prefillChangeAccepted = output<string>();
  readonly prefillChangeDeclined = output<string>();

  @ViewChild(FieldDirective) fieldComponent!: AbstractFieldComponent<unknown>;

  FieldType = DynamicFormFieldTypes;

  computedFieldInputDisabled = computed(
    () => !this.allowManualComputedValueEdit()
  );

  readonly customAction = output<FieldCustomAction>();
  readonly dataChange = output<DynamicFormField<unknown>>();
  readonly submit = output<void>();

  ngOnInit() {
    const storedValue = this.formData()[this.field().name];

    // Only hydrate from formData when the field has no value yet.
    // This prevents stale design-time values (e.g. disclaimer title) from
    // overwriting the latest configuration stored on the field itself.
    if (
      storedValue !== undefined &&
      storedValue !== null &&
      this.field().value === undefined
    ) {
      this.field().value = storedValue;
    }
  }

  isPrefillChangeAvailable = computed(() => {
    return (
      this.field().prefillable === true &&
      Object.keys(this.prefillPendingChanges()).includes(this.field().name) &&
      !isEqual(
        this.field().value,
        this.prefillPendingChanges()[this.field().name]
      )
    );
  });

  getFieldAsVoid(): DynamicFormField<void> {
    return this.field() as DynamicFormField<void>;
  }

  getFieldAsNote(): DynamicFormField<NoteFieldModel> {
    return this.field() as DynamicFormField<NoteFieldModel>;
  }

  getFieldAsFileUpload(): DynamicFormField<FileUploadFieldModel> {
    return this.field() as DynamicFormField<FileUploadFieldModel>;
  }

  getFieldAsString(): DynamicFormField<string> {
    return this.field() as DynamicFormField<string>;
  }

  getFieldAsNumber(): DynamicFormField<number> {
    return this.field() as DynamicFormField<number>;
  }

  getFieldAsBoolean(): DynamicFormField<boolean> {
    return this.field() as DynamicFormField<boolean>;
  }

  getFieldAsLoanInformation(): DynamicFormField<LoanInformationFieldModel> {
    return this.field() as DynamicFormField<LoanInformationFieldModel>;
  }

  getFieldAsLoanPurpose(): DynamicFormField<LoanPurposeFieldModel[]> {
    return this.field() as DynamicFormField<LoanPurposeFieldModel[]>;
  }

  getFieldAsLoanSources(): DynamicFormField<LoanSourceFieldModel> {
    return this.field() as DynamicFormField<LoanSourceFieldModel>;
  }

  getFieldAsBorrowers(): DynamicFormField<BorrowersFieldModel> {
    return this.field() as DynamicFormField<BorrowersFieldModel>;
  }

  getFieldAsDisclaimer(): DynamicFormField<DisclaimerFieldModel> {
    return this.field() as DynamicFormField<DisclaimerFieldModel>;
  }

  getFieldAsQuestionnaire(): DynamicFormField<QuestionnaireFieldModel> {
    return this.field() as DynamicFormField<QuestionnaireFieldModel>;
  }

  getFieldAsCropDetails(): DynamicFormField<CropDetailsFieldModel[]> {
    return this.field() as DynamicFormField<CropDetailsFieldModel[]>;
  }

  getFieldAsUseOfFunds(): DynamicFormField<UseOfFundsFieldModel[]> {
    return this.field() as DynamicFormField<UseOfFundsFieldModel[]>;
  }

  getFieldAsRepeatableCard(): DynamicFormField<RepeatableCardFieldModel> {
    return this.field() as DynamicFormField<RepeatableCardFieldModel>;
  }

  getFieldALivestockDetails(): DynamicFormField<LivestockDetailsFieldModel[]> {
    return this.field() as DynamicFormField<LivestockDetailsFieldModel[]>;
  }

  getFieldAsOnScreenApproval(): DynamicFormField<OnScreenApprovalFieldModel> {
    return this.field() as DynamicFormField<OnScreenApprovalFieldModel>;
  }

  isTouched(): boolean {
    return this.fieldComponent?.touched() ?? false;
  }

  getErrorKey(): ValidationErrorKey | undefined {
    if (
      this.field().fieldType === DynamicFormFieldTypes.COMPUTED ||
      this.field().fieldType === DynamicFormFieldTypes.NOTE
    ) {
      return undefined;
    }
    return this.fieldComponent?.getErrorKey();
  }

  getErrorMessage(): string | undefined {
    if (
      this.field().fieldType === DynamicFormFieldTypes.COMPUTED ||
      this.field().fieldType === DynamicFormFieldTypes.NOTE
    ) {
      return undefined;
    }
    return this.fieldComponent?.getErrorMessage();
  }

  isValid(): boolean {
    if (this.field().fieldType === DynamicFormFieldTypes.COMPUTED) {
      return true;
    }
    return this.fieldComponent?.isValid() ?? true;
  }

  handleCustomAction(event: FieldCustomAction) {
    this.customAction.emit(event);
  }

  handleDataChange(field: DynamicFormField<unknown>) {
    this.dataChange.emit(field);
  }

  handleSubmit() {
    this.submit.emit();
  }

  // PREFILL DATA

  canPreviewPrefillChange() {
    const value = this.prefillPendingChanges()[this.field().name];

    if (isUndefinedOrNull(value)) {
      return false;
    }

    if (isDate(value)) {
      return true;
    }

    if (isPrimitiveType(value)) {
      return true;
    }

    if (Array.isArray(value)) {
      return true;
    }

    return false;
  }

  getPrefillChangePreview(): string {
    const value = this.prefillPendingChanges()[this.field().name];

    if (isUndefinedOrNull(value)) {
      return '-';
    }

    if (isDate(value)) {
      return (
        TimeUtil.convertSecondTimestampToLocaleDateString(
          TimeUtil.convertDateToSecondTimestamp(value as Date)
        ) ?? '-'
      );
    }

    if (isPrimitiveType(value)) {
      if (
        isNumber(value) &&
        this.field().fieldType === DynamicFormFieldTypes.DATE
      ) {
        return (
          TimeUtil.convertSecondTimestampToLocaleDateString(value as number) ??
          ''
        );
      }

      if (isString(value) && value.trim() === '') {
        return '-';
      }

      return `${value}`;
    }

    if (Array.isArray(value)) {
      return `item count is now ${(value as Array<unknown>).length}`;
    }

    return '-';
  }
}
