import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import type { Field } from '../../../services/products/fields/fields.models';
import { FORMULA_CATEGORIES } from './formula-categories.constant';
import { validateFormulaExpression } from './formula-validation.util';

interface FormulaInfo {
  name: string;
  category: string;
}

@Component({
  selector: 'lj-formula-input',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatMenuModule,
  ],
  templateUrl: './formula-input.component.html',
  styleUrl: './formula-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormulaInputComponent),
      multi: true,
    },
  ],
})
export class FormulaInputComponent implements ControlValueAccessor, OnInit {
  fields = input<Field[]>([]);

  value = signal<string>('');
  disabled = signal<boolean>(false);

  formulas = signal<FormulaInfo[]>([]);
  filteredSuggestions = signal<string[]>([]);
  showSuggestions = signal<boolean>(false);
  cursorPosition = signal<number>(0);
  selectedSuggestionIndex = signal<number>(-1);
  validationResult = computed(() => {
    const formula = this.value();
    const fieldNames = this.fields().map(f => f.name);
    return validateFormulaExpression(formula, fieldNames);
  });

  readonly inputElement = viewChild<ElementRef>('formulaInput');

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.loadFormulas();
  }

  private loadFormulas(): void {
    const allFormulas: FormulaInfo[] = Object.entries(FORMULA_CATEGORIES).map(
      ([name, category]) => ({
        name,
        category,
      })
    );

    this.formulas.set(allFormulas.sort((a, b) => a.name.localeCompare(b.name)));
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    const cursorPos = inputElement.selectionStart || 0;

    this.value.set(newValue);
    this.cursorPosition.set(cursorPos);
    this.onChange(newValue);
    this.updateSuggestions(newValue, cursorPos);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions()) {
      return;
    }

    const suggestions = this.filteredSuggestions();
    const currentIndex = this.selectedSuggestionIndex();

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex =
          currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        this.selectedSuggestionIndex.set(nextIndex);
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        this.selectedSuggestionIndex.set(prevIndex);
        break;
      }

      case 'Enter': {
        event.preventDefault();
        const selectedSuggestion = suggestions[currentIndex];
        if (
          currentIndex >= 0 &&
          currentIndex < suggestions.length &&
          selectedSuggestion
        ) {
          this.selectSuggestion(selectedSuggestion);
        }
        break;
      }

      case 'Escape': {
        event.preventDefault();
        this.showSuggestions.set(false);
        this.selectedSuggestionIndex.set(-1);
        break;
      }
    }
  }

  onBlur(): void {
    this.onTouched();

    setTimeout(() => {
      this.showSuggestions.set(false);
      this.selectedSuggestionIndex.set(-1);
    }, 200);
  }

  onFocus(): void {
    const currentValue = this.value();
    const cursorPos = this.cursorPosition();
    this.updateSuggestions(currentValue, cursorPos);
  }

  private updateSuggestions(value: string, cursorPos: number): void {
    if (!value || cursorPos === 0) {
      this.showSuggestions.set(false);
      return;
    }

    const beforeCursor = value.substring(0, cursorPos);
    const match = beforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);

    if (!match) {
      this.showSuggestions.set(false);
      return;
    }

    const currentWord = match[1]?.toUpperCase();

    if (!currentWord) {
      this.showSuggestions.set(false);
      return;
    }

    const formulaSuggestions = this.formulas()
      .filter(f => f.name.toUpperCase().startsWith(currentWord))
      .map(f => f.name);

    const fieldSuggestions = this.fields()
      .filter(field => field.name.toUpperCase().startsWith(currentWord))
      .map(field => field.name);

    const allSuggestions = [...formulaSuggestions, ...fieldSuggestions];

    if (allSuggestions.length > 0) {
      this.filteredSuggestions.set(allSuggestions.slice(0, 10));
      this.showSuggestions.set(true);
      this.selectedSuggestionIndex.set(-1);
    } else {
      this.showSuggestions.set(false);
      this.selectedSuggestionIndex.set(-1);
    }
  }

  selectSuggestion(suggestion: string): void {
    const currentValue = this.value();
    const cursorPos = this.cursorPosition();

    const beforeCursor = currentValue.substring(0, cursorPos);
    const match = beforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);

    if (match) {
      const startPos = cursorPos - (match[1]?.length ?? 0);
      const newValue =
        currentValue.substring(0, startPos) +
        suggestion +
        currentValue.substring(cursorPos);

      this.value.set(newValue);
      this.onChange(newValue);

      setTimeout(() => {
        const inputElement = this.inputElement()?.nativeElement;
        if (inputElement) {
          const newCursorPos = startPos + suggestion.length;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
          inputElement.focus();
        }
      }, 0);
    }

    this.showSuggestions.set(false);
    this.selectedSuggestionIndex.set(-1);
  }

  insertFormula(formulaName: string): void {
    const currentValue = this.value();
    const inputElement = this.inputElement()?.nativeElement;
    const cursorPos = inputElement?.selectionStart || currentValue.length;

    const formulaText = `${formulaName}()`;
    const newValue =
      currentValue.substring(0, cursorPos) +
      formulaText +
      currentValue.substring(cursorPos);

    this.value.set(newValue);
    this.onChange(newValue);

    setTimeout(() => {
      if (inputElement) {
        const newCursorPos = cursorPos + formulaName.length + 1;
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
        inputElement.focus();
      }
    }, 0);
  }

  getFormulasByCategory(category: string): FormulaInfo[] {
    return this.formulas().filter(f => f.category === category);
  }

  get categories(): string[] {
    const cats = new Set(this.formulas().map(f => f.category));
    return Array.from(cats).sort();
  }

  isFormula(name: string): boolean {
    return this.formulas().some(f => f.name === name);
  }
}
