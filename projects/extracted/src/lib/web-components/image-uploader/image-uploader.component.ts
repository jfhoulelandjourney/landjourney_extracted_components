import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivateDirective } from '../../directives/activate/activate.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lj-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss'],
  imports: [MatIconModule, MatButtonModule, ActivateDirective],
})
export class ImageUploaderComponent {
  logoUrl = input<string | undefined>(undefined);
  readonly onLogoChange = output<string | undefined>();

  previewUrl = signal<string | undefined>(undefined);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        this.previewUrl.set(result);
        this.onLogoChange.emit(result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  removeLogo() {
    this.previewUrl.set(undefined);
    this.onLogoChange.emit(undefined);
  }
}
