import { Directive, HostBinding, HostListener, output } from '@angular/core';

export interface FileDropEvent {
  containerId: string;
  file: File;
}

@Directive({
  selector: '[lj-file-drag-drop]',
  standalone: true,
})
export class FileDragDropDirective {
  @HostBinding('class.file-over') fileOver = false;

  readonly fileDropped = output<FileDropEvent>();

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.fileOver = false;
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();

    if (!(event.target && event.target instanceof HTMLElement)) {
      return;
    }

    this.fileOver = false;
    const files = event.dataTransfer?.files;
    const droppedFile = files?.[0];
    if (droppedFile) {
      this.fileDropped.emit({
        containerId: event.target?.id,
        file: droppedFile,
      });
    }
  }
}
