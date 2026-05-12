import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { getUUID4 } from '../../../utils/stringUtil';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-uploader-container',
  imports: [ActivateDirective],
  templateUrl: './uploader-container.component.html',
  styleUrl: './uploader-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(drop)': 'handleDragDrop($event)',
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
  },
})
export class LjUploaderContainerComponent {
  fileInput = viewChild('fileInput', { read: ElementRef });

  id = input(getUUID4());
  disabled = input(false);
  supportedFileTypes = input<string | string[] | null>(null);

  acceptedFileTypes = computed(() => {
    const types = this.supportedFileTypes();
    if (!types) return '*/*'; // Accept all if none specified

    // If supportedFileTypes is a comma-separated string, just return it
    if (typeof types === 'string') {
      return types;
    }

    if (Array.isArray(types)) {
      return types.join(',');
    }

    return '*/*';
  });

  readonly selectedFiles = output<File[]>();
  readonly invalidFiles = output<File[]>();
  readonly change = output<Event>();
  readonly dragOver = output<Event>();
  readonly dragLeave = output<Event>();
  readonly dragDrop = output<Event>();

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.emit(event);
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragLeave.emit(event);
  }

  handleDragDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragDrop.emit(event);
    this.handleFileInput(event.dataTransfer?.files);
    this.resetInput();
  }

  handleChange(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.change.emit(event);
    const files = (event.target as HTMLInputElement).files;
    this.handleFileInput(files);
    this.resetInput();
  }

  handleClick(fileInput: HTMLInputElement) {
    if (this.disabled()) {
      return;
    }
    fileInput.click();
  }

  resetInput() {
    const input = this.fileInput();
    if (!input) return;
    input.nativeElement.value = '';
  }

  // You could also add validation
  validateFileType(fileList?: FileList | null): {
    valid: File[];
    invalid: File[];
  } {
    if (!fileList || fileList.length === 0)
      return {
        valid: [],
        invalid: [],
      };

    const files = Array.from(fileList);

    if (!this.supportedFileTypes())
      return {
        valid: files,
        invalid: [],
      };

    const response = {
      valid: [] as File[],
      invalid: [] as File[],
    };

    for (const file of files) {
      const fileType = file.type;
      const fileName = file.name;
      const acceptedTypes = this.acceptedFileTypes().split(',');

      const valid = acceptedTypes.some(type => {
        // Handle wildcards like "image/*"
        if (type.endsWith('/*')) {
          // Here we can guarantee that baseType exists because the endsWith check passed
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const baseType = type.split('/').at(0)!;
          return fileType.startsWith(baseType);
        }

        // Handle specific extensions like ".pdf"
        if (type.startsWith('.')) {
          return fileName.toLowerCase().endsWith(type.toLowerCase());
        }

        // Handle specific MIME types
        return fileType === type;
      });

      if (valid) {
        response.valid.push(file);
      } else {
        response.invalid.push(file);
      }
    }

    return response;
  }

  handleFileInput(fileList?: FileList | null) {
    const { valid, invalid } = this.validateFileType(fileList);

    if (invalid.length > 0) {
      // Handle invalid file type
      console.error('Invalid file type', invalid);
      this.invalidFiles.emit(invalid);
    }

    if (valid.length > 0) {
      this.selectedFiles.emit(valid);
    }
  }
}
