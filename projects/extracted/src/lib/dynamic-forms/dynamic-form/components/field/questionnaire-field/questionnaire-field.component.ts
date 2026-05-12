import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from '@angular/core';
import { AbstractFieldComponent } from '../../abstract-field.component';

import { FormsModule } from '@angular/forms';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { FieldDirective } from '../../../../../directives/field.directive';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { LabelFieldComponent } from '../../../../../web-components/typography/label-field/label-field.component';
import type {
  QuestionModel,
  QuestionnaireFieldModel,
} from '../../../../models/fields.models';
import { ValidationErrorKey } from '../../../../utilities/validation-errors.util';

@Component({
  selector: 'lj-df-questionnaire-field',
  imports: [
    FormsModule,
    MatCheckboxModule,
    LjInputFieldComponent,
    MatIconModule,
    MatRadioModule,
    LabelFieldComponent,
  ],
  templateUrl: './questionnaire-field.component.html',
  styleUrl: './questionnaire-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: QuestionnaireFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class QuestionnaireFieldComponent
  extends AbstractFieldComponent<QuestionnaireFieldModel>
  implements OnInit
{
  isMobile = input<boolean>(false);
  isBackoffice = window.location.href.toLowerCase().includes('backoffice');

  ngOnInit() {
    if (
      this.field &&
      (this.field().value === undefined ||
        this.field().value === null ||
        !('title' in (this.field().value ?? {})))
    ) {
      this.field().value = {
        title: '',
        questions: [],
        askForExplanations: true,
      };
    }
  }

  override getErrorKey(): ValidationErrorKey | undefined {
    const value = this.field().value;

    if (!value) {
      return ValidationErrorKey.REQUIRED;
    }

    for (const question of value.questions) {
      if (question.text.trim() === '') {
        return ValidationErrorKey.MISSING_QUESTION;
      }

      if (
        question.answer === 'yes' &&
        question.details.trim() === '' &&
        value.askForExplanations
      ) {
        return ValidationErrorKey.MISSING_EXPLANATION;
      }

      if (question.answer === '') {
        return ValidationErrorKey.MISSING_ANSWER;
      }
    }

    return undefined;
  }

  override isValid(): boolean {
    this.touched.set(true);

    return this.getErrorKey() === undefined;
  }

  getDetailsRequestText(value: string) {
    if (!value || value.trim() === '') {
      return 'Please provide more details.';
    }

    return value;
  }

  handleQuestionAnswerChange(value: string, question: QuestionModel) {
    const questions = this.field().value?.questions ?? [];
    const q = questions.find(q => q.id === question.id);

    if (!q) {
      return;
    }

    const newQuestions = (this.field().value?.questions ?? []).map(q =>
      q.id === question.id
        ? {
            ...q,
            answer: value,
          }
        : q
    );

    this.field().value = {
      title: this.field().value?.title ?? '',
      questions: newQuestions,
      askForExplanations: this.field().value?.askForExplanations ?? true,
    };

    if (value !== q?.answer) {
      this.dataChange.emit(this.field());
    }
  }

  handleQuestionDetailsChange(question: QuestionModel, value: string) {
    const questions = this.field().value?.questions ?? [];
    const q = questions.find(q => q.id === question.id);

    if (!q) {
      return;
    }

    const newQuestions = (this.field().value?.questions ?? []).map(q =>
      q.id === question.id
        ? {
            ...q,
            details: value,
          }
        : q
    );

    this.field().value = {
      title: this.field().value?.title ?? '',
      questions: newQuestions,
      askForExplanations: this.field().value?.askForExplanations ?? true,
    };

    if (value !== q?.details) {
      this.dataChange.emit(this.field());
    }
  }

  clearValue() {
    const newQuestions = (this.field().value?.questions ?? []).map(q => ({
      ...q,
      answer: '',
      details: '',
    }));

    this.field().value = {
      title: this.field().value?.title ?? '',
      questions: newQuestions,
      askForExplanations: this.field().value?.askForExplanations ?? true,
    };

    this.dataChange.emit(this.field());
  }
}
