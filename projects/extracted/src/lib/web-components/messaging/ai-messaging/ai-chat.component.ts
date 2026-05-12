import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, input, OnChanges, signal, SimpleChanges, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IAMService } from '../../../services/identity/iam.service';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { AvatarComponent } from '../../../design-system';
import { Task } from '../../../models/sectionModels';
import { DocumentQueryAiService } from '../../../services/documents/document-query-ai.service';
import { finalize } from 'rxjs/operators';
import { LjButtonComponent } from '../../button/button.component';
import { MatTooltip } from '@angular/material/tooltip';

type ChatMessage = {
  message: string;
  sender: 'user' | 'assistant' | 'system';
  temporary?: boolean;
};

@Component({
  selector: 'lj-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
  imports: [
    MatIconModule,
    ActivateDirective,
    AvatarComponent,
    LjButtonComponent,
    MatTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AiChatComponent implements OnChanges {
  private iamService = inject(IAMService);
  private queryAiService = inject(DocumentQueryAiService);

  task = input<Task | null>();
  currentDocumentName = input<string>();
  documentId = signal<string>('');
  documentDigest = signal<string>('');
  documentDescription = signal<string>('');
  messages = signal<ChatMessage[]>([]);
  newMessage = signal<string>('');
  waitingAnswer = signal(false);
  isCollapsed = signal(true);

  @ViewChild('messageList') private messageList!: ElementRef;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.currentDocumentName) {
      this.getMergedDocumentsForTask(this.task()?.id, this.task()?.taskDigest);
    }
  }

  public getMergedDocumentsForTask(taskId?: string, digest?: string) {
    if (taskId && digest) {
      this.queryAiService.getMergedDocumentsForTask(taskId, digest).subscribe({
        next: documents => {
          const selectedDocument = documents.find(
            document =>
              document.originalName === `${this.currentDocumentName()}.pdf`
          );
          if (
            selectedDocument &&
            selectedDocument.id &&
            selectedDocument.digest
          ) {
            this.documentId.set(selectedDocument.id);
            this.documentDigest.set(selectedDocument.digest);
            this.getConversation(selectedDocument.id, selectedDocument.digest);
            return;
          }
          this.documentId.set('');
          this.documentDigest.set('');
          this.messages.set([]);
        },
        error: error => {
          console.error(error);
        },
      });
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageList?.nativeElement) {
        this.messageList.nativeElement.scrollTop =
          this.messageList.nativeElement.scrollHeight;
      }
    }, 10);
  }

  private getInitialMessage(): ChatMessage {
    return {
      message: 'Hi, I am here to help you. How can I assist you today?',
      sender: 'assistant',
    };
  }

  private getProcessingMessage(): ChatMessage {
    return {
      message: 'Thinking...',
      sender: 'assistant',
      temporary: true,
    };
  }

  getConversation(documentId: string, digest: string) {
    const initialMessage: ChatMessage = this.getInitialMessage();
    this.waitingAnswer.set(true);
    this.queryAiService
      .getConversation(documentId, digest)
      .pipe(
        finalize(() => {
          this.waitingAnswer.set(false);
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: messages => {
          const chatMessages = messages.map(message => {
            return {
              message: message.content[0]?.text ?? '',
              sender: message.role,
            };
          });
          this.messages.set([initialMessage, ...chatMessages]);
        },
        error: error => {
          console.error(error);
        },
      });
  }

  addMessage() {
    const documentId = this.documentId();
    const documentDigest = this.documentDigest();
    const newMessage = this.newMessage();
    if (!newMessage || !documentId || !documentDigest) {
      return;
    }
    this.messages.update(messages => [
      ...messages,
      {
        message: newMessage,
        sender: 'user',
      },
      this.getProcessingMessage(),
    ]);
    this.waitingAnswer.set(true);
    this.scrollToBottom();
    this.queryAiService
      .queryDocument(documentId, documentDigest, newMessage)
      .pipe(
        finalize(() => {
          this.waitingAnswer.set(false);
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: response => {
          const assistantMessage = response.find(
            message => message.role === 'assistant'
          );
          this.messages.update(messages => [
            ...messages.filter(message => !message.temporary),
            {
              message: assistantMessage?.content[0]?.text ?? '',
              sender: 'assistant',
            },
          ]);
        },
        error: error => {
          console.error(error);
        },
      });

    this.newMessage.set('');
  }

  getAvatar(): string {
    return this.iamService.getActiveUser()?.avatarUri ?? '';
  }

  getFirstName(): string {
    if (
      !this.iamService.getActiveUser()?.firstName &&
      !this.iamService.getActiveUser()?.lastName
    ) {
      return this.iamService.getActiveUser()?.email ?? '';
    }

    return this.iamService.getActiveUser()?.firstName ?? '';
  }

  handleNewMessageChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.newMessage.set(value);
  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
    this.scrollToBottom();
  }

  generateSummary() {
    const documentId = this.documentId();
    const documentDigest = this.documentDigest();
    if (!documentId || !documentDigest) {
      return;
    }
    this.messages.update(messages => [
      ...messages,
      {
        message: 'Summarize document',
        sender: 'user',
      },
      this.getProcessingMessage(),
    ]);
    this.waitingAnswer.set(true);
    this.scrollToBottom();
    this.queryAiService
      .generateSummary(documentId, documentDigest)
      .pipe(
        finalize(() => {
          this.waitingAnswer.set(false);
          this.scrollToBottom();
        })
      )
      .subscribe({
        next: response => {
          const assistantMessage = response.find(
            message => message.role === 'assistant'
          );
          this.documentDescription.set(
            assistantMessage?.content[0]?.text ?? ''
          );
          this.messages.update(messages => [
            ...messages.filter(message => !message.temporary),
            {
              sender: 'assistant',
              message: `Here is a summary of the document: \n${this.documentDescription()}`,
            },
          ]);
        },
        error: error => {
          console.error(error);
        },
      });
  }

  deleteConversation() {
    const documentId = this.documentId();
    const digest = this.documentDigest();
    if (!documentId || !digest) {
      return;
    }
    this.queryAiService.deleteConversation(documentId, digest).subscribe({
      next: () => {
        this.messages.set([this.getInitialMessage()]);
      },
      error: (error: Error) => {
        console.error(error);
      },
    });
  }
}
