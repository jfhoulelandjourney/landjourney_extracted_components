import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor, NgxEditorModule } from 'ngx-editor';

@Component({
  selector: 'lj-rich-text',
  imports: [NgxEditorModule, FormsModule],
  templateUrl: './rich-text.component.html',
  styleUrl: './rich-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextComponent implements OnDestroy {
  editor: Editor;

  placeholder = input<string>('Enter content here...');
  required = input<boolean>(false);
  value = input<string>('');
  readonly valueChange = output<string>();

  constructor() {
    this.editor = new Editor();
  }

  ngOnDestroy() {
    this.editor.destroy();
  }

  handleChange(value: string) {
    this.valueChange.emit(value);
  }
}
