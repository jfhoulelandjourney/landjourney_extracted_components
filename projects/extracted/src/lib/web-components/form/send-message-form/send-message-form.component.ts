import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Subject, takeUntil } from 'rxjs';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { CustomTooltipDirective } from '../../../directives/custom-tooltip/custom-tooltip.directive';
import { IAMService } from '../../../services/identity/iam.service';
import { OrganizationService } from '../../../services/organization/organization.service';
import { getDefaultMessage, Message } from '../../../types/messages';
import { TimeUtil } from '../../../utils/timeUtil';
import { LjButtonComponent } from '../../button/button.component';
import { LjInputComponent } from '../input/input.component';

@Component({
  selector: 'lj-send-message-form',
  providers: [DatePipe],
  imports: [
    ActivateDirective,
    CustomTooltipDirective,
    FormsModule,
    LjButtonComponent,
    LjInputComponent,
    MatIcon,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './send-message-form.component.html',
  styleUrl: './send-message-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendMessageFormComponent implements OnInit {
  private iamService = inject(IAMService);
  organizationService = inject(OrganizationService);

  message = input<Message>(getDefaultMessage());
  isLoading = input<boolean>(false);
  showHelp = input<boolean>(true);

  dueDate = signal<number>(TimeUtil.getTimestampSeconds());
  isTemplate = input<boolean>(false);
  showDueDate = input<boolean>(false);

  sendAs = signal<string>('');
  subject = signal<string>('');
  body = signal<string>('');
  showClearButton = signal<boolean>(false);

  subjectElement = viewChild.required('subjectElement', { read: ElementRef });
  bodyElement = viewChild.required('bodyElement', { read: ElementRef });

  subjectSelectionStart: number | null = null;
  subjectSelectionEnd: number | null = null;
  bodySelectionStart: number | null = null;
  bodySelectionEnd: number | null = null;

  private destroy$ = new Subject<void>();

  readonly messageChanged = output<Message>();

  constructor() {
    toObservable(this.message)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: message => {
          this.sendAs.set(message.sender ?? '');
          this.subject.set(message.subject);
          this.dueDate.set(message.dueDate ?? 0);
          this.body.set(message.body);
          this.showClearButton.set(message.body.trim() !== '');
        },
      });
  }

  ngOnInit() {
    this.handleSubjectChange(
      `Next steps with ${this.organizationService.uiConfiguration.name}`
    );
  }

  noSelectionPresent(target: HTMLInputElement | HTMLTextAreaElement) {
    if (!target.selectionStart && !target.selectionEnd) {
      return true;
    }

    return false;
  }

  insertSubjectVariable(variableName: string) {
    let value: string = this.subjectElement().nativeElement.value;
    const start: string = value.slice(
      0,
      this.subjectSelectionStart ?? this.subject().length
    );
    const middle = `{{${variableName}}}`;
    const end: string = value.slice(
      this.subjectSelectionEnd ?? this.subject().length,
      this.subject().length
    );
    value = [start, middle, end].join('');

    this.subject.set(value);
    this.handleSubjectChange(value);
    this.subjectElement().nativeElement.focus();
  }

  insertBodyVariable(variableName: string) {
    let value: string = this.bodyElement().nativeElement.value;
    const start: string = value.slice(
      0,
      this.bodySelectionStart ?? this.body().length
    );
    const middle = `{{${variableName}}}`;
    const end: string = value.slice(
      this.bodySelectionEnd ?? this.body().length,
      this.body().length
    );
    value = [start, middle, end].join('');

    this.body.set(value);
    this.handleBodyChange(value);
    this.bodyElement().nativeElement.focus();
  }

  trackSubjectSelectionKeys(event: Event) {
    this.trackSubjectSelection(event);
  }

  trackSubjectSelection(event: Event) {
    const target = event.currentTarget as HTMLInputElement;

    if (this.noSelectionPresent(target)) {
      return;
    }

    this.subjectSelectionStart = target.selectionStart;
    this.subjectSelectionEnd = target.selectionEnd;
  }

  trackBodySelectionKeys(event: Event) {
    this.trackSubjectSelection(event);
  }

  trackBodySelection(event: Event) {
    const target = event.currentTarget as HTMLTextAreaElement;

    if (this.noSelectionPresent(target)) {
      return;
    }

    this.bodySelectionStart = target.selectionStart;
    this.bodySelectionEnd = target.selectionEnd;
  }

  getSender(): string {
    return this.sendAs() || this.iamService.getActiveUser()?.email || '';
  }

  getDate(): string {
    const date = TimeUtil.convertSecondTimestampToDate(this.dueDate());
    return new DatePipe('en-US').transform(date, 'yyyy-MM-dd') || '';
  }

  handleDueDateChange(dueDate: number) {
    const updatedMessage = this.message();
    updatedMessage.dueDate = dueDate;
    this.handleMessageChange(updatedMessage);
  }

  handleSubjectChange(subject: string) {
    const updatedMessage = this.message();
    updatedMessage.subject = subject;
    this.handleMessageChange(updatedMessage);
  }

  handleBodyChange(body: string) {
    const updatedMessage = this.message();
    updatedMessage.body = body;
    this.handleMessageChange(updatedMessage);
  }

  handleMessageChange(updatedMessage: Message) {
    this.showClearButton.set(updatedMessage.body.trim() !== '');
    this.messageChanged.emit(updatedMessage);
  }

  clearField() {
    const el = this.bodyElement().nativeElement;
    if (el) {
      el.value = '';
    }
    this.handleBodyChange('');
  }
}
