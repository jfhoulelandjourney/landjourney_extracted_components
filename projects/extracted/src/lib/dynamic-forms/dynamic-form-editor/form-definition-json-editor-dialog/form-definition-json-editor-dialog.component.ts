import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  MonacoEditorConstructionOptions,
  MonacoEditorModule,
  MonacoStandaloneCodeEditor,
} from '@materia-ui/ngx-monaco-editor';

import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { LjButtonComponent } from '../../../web-components/button/button.component';
import type { DynamicForm } from '../../models/dynamic-forms.models';

export interface FormDefinitionJsonEditorDialogData {
  initialJson: string;
}

@Component({
  selector: 'lj-form-definition-json-editor-dialog',
  imports: [
    FormsModule,
    LjButtonComponent,
    ActivateDirective,
    MatDialogModule,
    MonacoEditorModule,
  ],
  templateUrl: './form-definition-json-editor-dialog.component.html',
  styleUrl: './form-definition-json-editor-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefinitionJsonEditorDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<
      FormDefinitionJsonEditorDialogComponent,
      DynamicForm['formDefinition'] | undefined
    >
  );
  readonly data = inject<FormDefinitionJsonEditorDialogData>(MAT_DIALOG_DATA);

  readonly jsonText = signal(this.data.initialJson);
  readonly parseError = signal<string | null>(null);

  readonly editorOptions: MonacoEditorConstructionOptions = {
    language: 'json',
    roundedSelection: true,
    autoIndent: 'full',
    glyphMargin: false,
    folding: true,
    lineNumbers: 'on',
    lineDecorationsWidth: 60,
    lineNumbersMinChars: 0,
    minimap: { enabled: true },
    quickSuggestions: true,
    quickSuggestionsDelay: 100,
    wordBasedSuggestions: true,
  };

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  apply(): void {
    this.parseError.set(null);
    try {
      const parsed: unknown = JSON.parse(this.jsonText());
      if (!Array.isArray(parsed)) {
        this.parseError.set('The JSON must be an array (formDefinition).');
        return;
      }
      this.dialogRef.close(
        parsed as DynamicForm['formDefinition']
      );
    } catch {
      this.parseError.set('Invalid JSON.');
    }
  }

  onJsonTextChange(value: string): void {
    this.jsonText.set(value);
    this.parseError.set(null);
  }

  onMonacoInit(editor: MonacoStandaloneCodeEditor): void {
    editor.updateOptions(this.editorOptions);
    setTimeout(() => {
      editor.trigger(
        'form-definition-json',
        'editor.action.formatDocument',
        null
      );
    }, 0);
  }
}
