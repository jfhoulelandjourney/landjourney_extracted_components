import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ImageCropperModalComponent } from '../../../web-components/image/image-cropper/image-cropper-modal.component';
import { AvatarComponent } from '../../molecules';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'lj-editable-avatar',
  imports: [MatButtonModule, MatIconModule, ActivateDirective, AvatarComponent],
  templateUrl: './editable-avatar.component.html',
  styleUrl: './editable-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableAvatarComponent {
  readonly dialog = inject(MatDialog);
  readonly sanitizer = inject(DomSanitizer);

  name = input<string>('');
  tooltip = input<string | null>(null);
  avatarUrl = model<string | null>(null);
  size = input<'tiny' | 'small' | 'medium' | 'large' | 'x-large'>('medium');
  showBorder = input<boolean>(false);
  imagePadding = input<boolean>(false);
  forceText = input<boolean>(false);
  useNameColor = input<boolean>(true);
  textColor = input<string>('white');

  rawImageFile: string | undefined = undefined;
  imageFile = signal<string | undefined>(undefined);

  readonly avatarChange = output<string | undefined>();

  computedAvatarUrl = computed(() => {
    if (this.imageFile()) {
      return this.imageFile();
    }

    const avatarUrl = this.avatarUrl();

    if (avatarUrl && avatarUrl.toLowerCase().startsWith('data:')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(avatarUrl);
    }

    return avatarUrl;
  });

  async handleAvatarFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files as FileList;
    const selectedFile = files[0];

    if (selectedFile) {
      this.openImageCropper(event).subscribe(result => {
        if (result) {
          this.rawImageFile = result;
          this.imageFile.set(result as string);
          this.avatarChange.emit(result);
        }
      });
    }
  }

  openImageCropper(event: Event): Observable<string> {
    const dialogRef = this.dialog.open(ImageCropperModalComponent, {
      maxWidth: '80vw',
      maxHeight: '80vh',
      data: event,
    });

    return dialogRef.afterClosed();
  }

  cancelAvatarEdit() {
    this.rawImageFile = undefined;
    this.imageFile.set(undefined);
  }
}
