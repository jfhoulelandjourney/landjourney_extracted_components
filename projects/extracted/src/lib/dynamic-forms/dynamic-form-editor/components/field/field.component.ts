import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { OrganizationService } from '../../../../services/organization/organization.service';
import {
  DynamicFormField,
  DynamicFormFieldTypes,
  SectionLayouts,
  type DynamicFormSection,
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
import { getFieldsFromFormDefinition } from '../../../utilities/dynamicFormsUtil';
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
import { RepeatableCardFieldEditorComponent } from './repeatable-card-field/repeatable-card-field.component';
import { SelectFieldComponent } from './select-field/select-field.component';
import { SubmitButtonComponent } from './submit-button/submit-button.component';
import { TextFieldComponent } from './text-field/text-field.component';
import { UseOfFundsComponent } from './use-of-funds/use-of-funds.component';

@Component({
  selector: 'lj-df-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
  imports: [
    InputFieldComponent,
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
    RepeatableCardFieldEditorComponent,
    LivestockDetailsComponent,
    NoteFieldComponent,
    OnScreenApprovalComponent,
    ComputedFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent {
  protected readonly organizationService = inject(OrganizationService);
  field = input.required<DynamicFormField<unknown>>();
  formDefinition = input<(DynamicFormField<unknown> | DynamicFormSection)[]>(
    []
  );
  containerLayout = input.required<SectionLayouts>();
  FieldType = DynamicFormFieldTypes;

  readonly remove = output<DynamicFormField<unknown>>();
  readonly fieldChange = output<DynamicFormField<unknown>>();

  existingFields() {
    const fields = getFieldsFromFormDefinition(
      this.formDefinition() as Array<DynamicFormField | DynamicFormSection>
    );
    return Object.keys(fields).map(value => {
      return { id: value, value: value };
    });
  }

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

  getFieldAsLivestockDetails(): DynamicFormField<LivestockDetailsFieldModel[]> {
    return this.field() as DynamicFormField<LivestockDetailsFieldModel[]>;
  }

  getFieldAsOnScreenApproval(): DynamicFormField<OnScreenApprovalFieldModel> {
    return this.field() as DynamicFormField<OnScreenApprovalFieldModel>;
  }

  getFieldAsComputed(): DynamicFormField<string> {
    return this.field() as DynamicFormField<string>;
  }

  handleRemove(field: DynamicFormField<unknown>) {
    this.remove.emit(field);
  }

  handleFieldChange(field: DynamicFormField<unknown>) {
    this.fieldChange.emit(field);
  }
}
