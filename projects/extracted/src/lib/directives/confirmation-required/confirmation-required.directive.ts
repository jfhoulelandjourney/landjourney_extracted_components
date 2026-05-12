/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { BaseDialogComponent } from '../../web-components/dialogs/base-dialog/base-dialog.component';
import { ActivateDirective } from '../activate/activate.directive';

@Component({
  selector: 'landjourney-confirm-dialog',
  templateUrl: './confirmation-required.component.html',
  styleUrls: ['./confirmation-required.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActivateDirective, MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent
  extends BaseDialogComponent
  implements AfterViewInit
{
  dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef);
  data = inject<{
    dialogType: 'danger' | 'warning' | 'success' | 'info' | 'primary';
    message: string | TemplateRef<unknown>;
    confirmText: string;
    cancelText: string;
  }>(MAT_DIALOG_DATA);

  private dialogTypes = ['danger', 'warning', 'success', 'info', 'primary'];
  templateContainer = viewChild('templateContainer', {
    read: ViewContainerRef,
  });
  confirmButton = viewChild('confirmButton', { read: ElementRef });
  messageString: string | null = null;
  dialogType: 'danger' | 'warning' | 'success' | 'info' | 'primary' = 'danger';

  constructor() {
    super();

    if (typeof this.data.message === 'string') {
      this.messageString = this.data.message;
    }

    if (typeof this.data.dialogType === 'string') {
      this.dialogType = this.dialogTypes.includes(this.data.dialogType)
        ? this.data.dialogType
        : 'danger';
    }
  }

  ngAfterViewInit() {
    if (this.data.message instanceof TemplateRef) {
      this.templateContainer()?.createEmbeddedView(this.data.message);
    }
  }

  onConfirm(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.dialogRef.close(true);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.dialogRef.close(false);
  }
}

@Directive({
  selector: '[lj-confirmation-required]',
  standalone: true,
  exportAs: 'confirmDirective',
})
export class ConfirmationRequiredDirective<T = any>
  implements OnInit, OnChanges, OnDestroy
{
  private dialog = inject(MatDialog);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() message: string | TemplateRef<unknown> = 'Are you sure?';
  @Input() dialogType: 'danger' | 'warning' | 'success' | 'info' | 'primary' = 'danger';
  @Input() triggerColor: 'danger' | 'warning' | 'success' | 'info' | '' = '';
  @Input() confirmText = 'Yes';
  @Input() cancelText = 'Cancel';
  @Input() trigger: ElementRef<unknown> | null = null;
  @Input() method: 'listener' | 'direct-call' = 'listener';
  @Input() maxWidth = '70%';

  readonly confirm = output<T | undefined>();
  readonly cancel = output<T | undefined>();

  private triggerKeyboardKeys = ['enter', 'space'];
  private unsubscribeFns: VoidFunction[] = [];

  private addEventListeners() {
    this.removeEventListeners();

    if (this.method === 'direct-call') {
      this.unsubscribeFns = [];
      return;
    }

    const listenTarget = this.trigger || this.elementRef;
    const removeClickListener = this.renderer.listen(
      listenTarget.nativeElement,
      'click',
      (event: MouseEvent) => {
        this.onClick(event);
      }
    );
    const removeKeyboardListener = this.renderer.listen(
      listenTarget.nativeElement,
      'keyup',
      (event: KeyboardEvent) => {
        const key = event.key.toLocaleLowerCase();
        if (this.triggerKeyboardKeys.includes(key)) {
          this.onClick(event);
        }
      }
    );

    this.unsubscribeFns = [removeClickListener, removeKeyboardListener];
  }

  private removeEventListeners() {
    this.unsubscribeFns.forEach(fn => fn());
    this.unsubscribeFns = [];
  }

  ngOnInit(): void {
    // TODO: Create a map of classes based on possible types
    if (this.triggerColor) {
      this.renderer.addClass(this.elementRef.nativeElement, this.triggerColor);
    }
    this.addEventListeners();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['trigger'] || changes['listenerDisabled']) {
      this.addEventListeners();
    }
  }

  ngOnDestroy() {
    this.removeEventListeners();
  }

  openConfirmDialog(value?: T) {
    // TODO: Fix that double dialog issue, I know it's an ugly fix, but will do the trick for now.
    const ref = this.dialog.getDialogById('confirm-dialog');

    if (ref) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      id: 'confirm-dialog',
      minWidth: '450px',
      maxWidth: this.maxWidth,
      data: {
        dialogType: this.dialogType,
        message: this.message,
        confirmText: this.confirmText,
        cancelText: this.cancelText,
      },
      autoFocus: '.confirm-button',
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.confirm.emit(value);
      } else {
        this.cancel.emit(value);
      }
    });
  }

  onClick(event: MouseEvent | KeyboardEvent): void {
    if (this.method === 'direct-call') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.openConfirmDialog();
  }
}
