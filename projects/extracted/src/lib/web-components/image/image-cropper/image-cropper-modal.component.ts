import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { BaseDialogComponent } from '../../dialogs/base-dialog/base-dialog.component';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
} from 'ngx-image-cropper';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { LjButtonComponent } from '../../button/button.component';

const DEFAULT_TRANSFORM: ImageTransform = {
  translateUnit: 'px',
  scale: 1,
  rotate: 0,
  flipH: false,
  flipV: false,
  translateH: 0,
  translateV: 0,
};

@Component({
  selector: 'lj-image-cropper-modal',
  imports: [
    ImageCropperComponent,
    ActivateDirective,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIcon,
    LjButtonComponent,
  ],
  templateUrl: './image-cropper-modal.component.html',
  styleUrl: './image-cropper-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCropperModalComponent
  extends BaseDialogComponent
  implements OnInit
{
  inputElement = viewChild.required<ElementRef>('imageElement');

  imageChangedEvent = signal<Event | null | undefined>(undefined);
  croppedImage = signal<string | undefined>(undefined);

  canvasRotation = 0;
  transform = signal<ImageTransform>(DEFAULT_TRANSFORM);

  readonly dialogRef = inject(MatDialogRef<ImageCropperModalComponent>);
  readonly fileEvent = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.fileChangeEvent(this.fileEvent);
  }

  fileChangeEvent(event: Event): void {
    this.imageChangedEvent.set(event);
  }

  imageCroppedHandler(event: ImageCroppedEvent): void {
    if (event.base64) {
      this.croppedImage.set(event.base64);
      return;
    }

    if (event.blob) {
      this.getDataUrl(event.blob).then(value => {
        this.croppedImage.set(value);
      });
    }
  }

  async getDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  imageLoaded(): void {
    // Image loaded successfully
  }

  cropperReady(): void {
    // Cropper is ready
  }

  loadImageFailed(): void {
    console.error('Image load failed');
  }

  rotateLeft() {
    setTimeout(() => {
      this.canvasRotation--;
      this.flipAfterRotate();
    });
  }

  rotateRight() {
    setTimeout(() => {
      this.canvasRotation++;
      this.flipAfterRotate();
    });
  }

  flipAfterRotate() {
    const transform = this.transform();

    const flippedH = transform.flipH;
    const flippedV = transform.flipV;
    this.transform.set({
      ...transform,
      rotate: this.canvasRotation,
      flipH: flippedV,
      flipV: flippedH,
      translateH: 0,
      translateV: 0,
    });
  }

  updateRotation(rotate: number) {
    const transform = this.transform();

    this.transform.set({
      ...transform,
      rotate,
    });
  }

  flipHorizontal() {
    const transform = this.transform();

    this.transform.set({
      ...transform,
      flipH: !transform.flipH,
    });
  }

  flipVertical() {
    const transform = this.transform();

    this.transform.set({
      ...transform,
      flipV: !transform.flipV,
    });
  }

  zoomOut() {
    const transform = this.transform();

    this.transform.set({
      ...transform,
      scale: (transform.scale ?? 0) - 0.1,
    });
  }

  zoomIn() {
    const transform = this.transform();

    this.transform.set({
      ...transform,
      scale: (transform.scale ?? 0) + 0.1,
    });
  }

  reset() {
    this.canvasRotation = 0;
    this.transform.set(DEFAULT_TRANSFORM);
  }

  crop() {
    this.dialogRef.close(this.croppedImage());
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
