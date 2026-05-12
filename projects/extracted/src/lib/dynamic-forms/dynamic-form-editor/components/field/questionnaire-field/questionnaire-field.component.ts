import {
  CdkDrag,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  MatRadioModule,
} from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import { FieldDirective } from '../../../../../directives/field.directive';
import { getUUID4 } from '../../../../../utils/stringUtil';
import { LjButtonComponent } from '../../../../../web-components/button/button.component';
import { LjInputFieldComponent } from '../../../../../web-components/form/input-field/input-field.component';
import { AbstractFieldComponent } from '../../abstract-field.component';
import { ConditionalLogicComponent } from '../../configuration/conditional-logic/conditional-logic.component';
import { FieldConfigurationComponent } from '../../configuration/field-configuration/field-configuration.component';
import type {
  QuestionnaireFieldModel,
  QuestionModel,
} from '../../../../models/fields.models';

@Component({
  selector: 'lj-df-questionnaire-field',
  imports: [
    FormsModule,
    MatCheckboxModule,
    LjInputFieldComponent,
    LjButtonComponent,
    MatIconModule,
    ActivateDirective,
    MatRadioModule,
    FieldConfigurationComponent,
    ConditionalLogicComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    MatTooltipModule,
  ],
  templateUrl: './questionnaire-field.component.html',
  styleUrl: './questionnaire-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: FieldDirective, useExisting: QuestionnaireFieldComponent },
    { provide: MAT_RADIO_DEFAULT_OPTIONS, useValue: { color: 'accent' } },
  ],
})
export class QuestionnaireFieldComponent extends AbstractFieldComponent<QuestionnaireFieldModel> {
  handleInternalValueChange(value: Partial<QuestionnaireFieldModel>) {
    const field = this.field();

    if (!field || !field.value) return;

    const nextValue: QuestionnaireFieldModel = {
      ...field.value,
      ...value,
    };

    field.value = nextValue;
    this.field.set(field);
    this.handleValueChange(nextValue);
  }

  addNewQuestion() {
    const field = this.field();

    if (field && field.value) {
      field.value.questions.push({
        id: getUUID4(),
        text: '',
        answer: '',
        details: '',
        detailsRequestText: '',
      });
      this.field.set(field);
      this.handleValueChange(field.value);
    }
  }

  handleQuestionChange(question: QuestionModel, value: Partial<QuestionModel>) {
    Object.assign(question, value);

    const questions = this.field().value?.questions ?? [];
    const q = questions.find(q => q.id === question.id);

    if (q) {
      Object.assign(q, question);
    }

    this.handleInternalValueChange({ questions: questions });
  }

  deleteQuestion(question: QuestionModel) {
    const questions = this.field().value?.questions ?? [];

    this.handleInternalValueChange({
      questions: questions.filter(q => q.id !== question.id),
    });
  }

  drop(event: CdkDragDrop<unknown[]>) {
    const field = this.field();
    const questions = [...(field.value?.questions || [])];

    moveItemInArray(questions, event.previousIndex, event.currentIndex);

    this.handleInternalValueChange({ questions });
  }
}
