import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { arrow, computePosition, offset, shift } from '@floating-ui/dom';
import DOMPurify from 'dompurify';
import { QuillModule, Range } from 'ngx-quill';
import type { Blot } from 'parchment';
import Quill from 'quill';
import { firstValueFrom } from 'rxjs';
import {
  RequestUser,
  RequestUserTypes,
} from '../../../../models/requestModels';
import { UserProfile } from '../../../../models/userModels';
import { OrganizationService } from '../../../../services/organization/organization.service';
import './register-modules';

type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
};

interface TaggedUser {
  id: string;
  text: string;
  userId: string;
}

interface MentionItem {
  id: string;
  value: string;
  denotationChar: string;
  userId: string;
  mention: string;
  [key: string]: string;
}

type PopupModes = 'toolbar' | 'insert-link' | 'edit-link' | null;

interface SelectionFormat {
  boldActive: boolean;
  codeActive: boolean;
  italicActive: boolean;
  linkActive: boolean;
}

@Component({
  selector: 'lj-comment-quill-editor',
  templateUrl: './comment-quill-editor.component.html',
  styleUrls: ['./comment-quill-editor.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  imports: [FormsModule, QuillModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommentQuillEditorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  disabled = input.required<boolean>();
  deleted = input.required<boolean>();
  isOwner = input.required<boolean>();
  initialText = input.required<string>();
  isCustomer = input.required<boolean>();
  activeUser = input.required<UserProfile | null>();
  placeholder = input<string>('Write your comment');
  isDirty = model<boolean>(false);
  messageText = model<string>('');
  participants = model<string[]>([]);
  users = input.required<RequestUser[]>();
  enableEmployeeSearch = input<boolean>(false);
  readonly sendMessage = output();
  private quillEditorInstance = signal<Quill | null>(null);
  protected selectionFormat = signal<SelectionFormat>({
    boldActive: false,
    codeActive: false,
    italicActive: false,
    linkActive: false,
  });
  protected popupVisible = signal(false);
  protected popupMode = signal<PopupModes>(null);
  protected lastPopupMode = signal<PopupModes>(null);
  protected popupFocused = signal(false);
  protected suppressPopupClose = signal(false);

  private normalizeLinksHandle: number | null = null;
  private lastVirtualElement: VirtualElement | null = null;
  protected linkUrl = signal('');
  protected linkInputFocused = signal(false);
  protected savedRange = signal<Range | null>(null);

  protected floatingElementRef = viewChild('quillPopup', {
    read: ElementRef<HTMLDivElement>,
    debugName: 'floatingElement',
  });

  protected arrowElementRef = viewChild('quillPopupArrow', {
    read: ElementRef<HTMLDivElement>,
    debugName: 'floatingArrow',
  });

  protected linkInputRef = viewChild('linkInput', {
    read: ElementRef<HTMLInputElement>,
    debugName: 'linkInput',
  });

  private popupElement: HTMLDivElement | null = null;
  private popupPointerDownHandler = () => {
    this.popupFocused.set(true);
  };
  private popupFocusInHandler = () => {
    this.popupFocused.set(true);
  };
  private popupFocusOutHandler = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    const stillInside = nextTarget && this.popupElement?.contains(nextTarget);
    this.popupFocused.set(Boolean(stillInside));
    if (this.shouldHidePopup()) {
      this.hidePopup();
    }
  };
  private selectionChangeHandler:
    | ((range: Range | null, oldRange: Range | null) => void)
    | null = null;

  formats = ['bold', 'italic', 'code', 'link', 'mention'];

  constructor() {
    effect(() => {
      const initial = this.initialText();
      const editor = this.quillEditorInstance();
      if (editor && initial) {
        untracked(() => {
          const clean = DOMPurify.sanitize(initial, {
            ADD_ATTR: [
              'data-id',
              'data-value',
              'data-denotation-char',
              'data-user-id',
              'data-mention',
              'data-index',
              'contenteditable',
            ],
          });
          editor.clipboard.dangerouslyPasteHTML(clean, 'silent');
          // Update model to stay in sync with what we just pasted
          this.messageText.set(clean);
        });
      }
    });
  }

  private organizationService = inject(OrganizationService);

  modules = {
    toolbar: false,
    // theme: 'snow',
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
    mention: {
      allowedChars: /^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/,
      mentionDenotationChars: ['@'],
      showDenotationChar: true,
      minChars: 2,
      source: (
        searchTerm: string,
        renderList: (data: MentionItem[], searchTerm: string) => void
      ) => {
        this.getUserNames(searchTerm)
          .then(results => results.map(user => this.toMentionItem(user)))
          .then(values => renderList(values, searchTerm))
          .catch(() => {
            renderList([], searchTerm);
          });
      },
      renderItem: (item: MentionItem) => {
        return `${item.denotationChar}${item.value}`;
      },
      onSelect: (
        item: MentionItem,
        insertItem: (item: MentionItem) => void
      ) => {
        insertItem(item);
        if (item.userId) {
          this.participants.update(previous => {
            if (previous.includes(item.userId)) return previous;
            return [...previous, item.userId];
          });
        }
      },
      dataAttributes: ['id', 'value', 'denotationChar', 'mention', 'userId'],
    },
  };

  ngOnInit() {
    this.messageText.set(this.initialText());
  }

  ngAfterViewInit() {
    this.messageText.set(this.initialText());

    this.popupElement = this.floatingElementRef()?.nativeElement ?? null;
    if (this.popupElement) {
      this.popupElement.addEventListener(
        'pointerdown',
        this.popupPointerDownHandler
      );
      this.popupElement.addEventListener('focusin', this.popupFocusInHandler);
      this.popupElement.addEventListener('focusout', this.popupFocusOutHandler);
    }
  }

  onBlur() {
    this.popupFocused.set(false);
    setTimeout(() => {
      if (this.shouldHidePopup()) {
        this.hidePopup();
      }
    }, 0);
  }

  onEditorCreated(editor: Quill) {
    this.quillEditorInstance.set(editor);

    // Add Enter key binding for sending message
    editor.keyboard.addBinding({ key: 13, shiftKey: false }, () => {
      if (this.disabled()) {
        return true;
      }
      this.isDirty.set(false);
      this.sendMessage.emit();
      return false;
    });

    this.selectionChangeHandler = (range, oldRange) => {
      this.handleSelectionChange({ editor, range, oldRange });
    };
    editor.on('selection-change', this.selectionChangeHandler);

    // Normalize any pre-existing links
    this.normalizeLinks();

    // Ensure pasted links get attributes and class
    editor.clipboard.addMatcher('A', (node, delta) => {
      const attributes = delta.ops?.[0]?.attributes ?? {};
      return {
        ...delta,
        ops: delta.ops?.map(op => ({
          ...op,
          attributes: {
            ...op.attributes,
            ...attributes,
            link: (node as HTMLAnchorElement).getAttribute('href') ?? '',
          },
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    });
  }

  ngOnDestroy() {
    if (this.popupElement) {
      this.popupElement.removeEventListener(
        'pointerdown',
        this.popupPointerDownHandler
      );
      this.popupElement.removeEventListener(
        'focusin',
        this.popupFocusInHandler
      );
      this.popupElement.removeEventListener(
        'focusout',
        this.popupFocusOutHandler
      );
      this.popupElement = null;
    }

    const editor = this.quillEditorInstance();
    if (editor && this.selectionChangeHandler) {
      editor.off(
        'selection-change',
        this.selectionChangeHandler
      );
    }
    this.selectionChangeHandler = null;
    this.quillEditorInstance.set(null);
  }

  undo() {
    this.quillEditorInstance()?.history.undo();
  }

  canUndo(): boolean {
    const editor = this.quillEditorInstance();
    return editor
      ? editor.history.stack.undo.length > 0
      : false;
  }

  redo() {
    this.quillEditorInstance()?.history.redo();
  }

  canRedo(): boolean {
    const editor = this.quillEditorInstance();
    return editor
      ? editor.history.stack.redo.length > 0
      : false;
  }

  setBold() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    editor.focus();
    const range = editor.getSelection(true);
    if (!range) return;
    const currentFormat = editor.getFormat(range);
    const nextValue = !currentFormat['bold'];
    if (range.length === 0) {
      editor.format('bold', nextValue, 'user');
      this.updateSelectionFormat();
      return;
    }
    editor.formatText(
      range.index,
      range.length,
      'bold',
      nextValue,
      'user'
    );
    this.updateSelectionFormat();
  }

  setItalic() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    editor.focus();
    const range = editor.getSelection(true);
    if (!range) return;
    const currentFormat = editor.getFormat(range);
    const nextValue = !currentFormat['italic'];
    if (range.length === 0) {
      editor.format('italic', nextValue, 'user');
      this.updateSelectionFormat();
      return;
    }
    editor.formatText(
      range.index,
      range.length,
      'italic',
      nextValue,
      'user'
    );
    this.updateSelectionFormat();
  }

  setCode() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    editor.focus();
    const range = editor.getSelection(true);
    if (!range) return;
    const currentFormat = editor.getFormat(range);
    const nextValue = !currentFormat['code'];
    if (range.length === 0) {
      editor.format('code', nextValue, 'user');
      this.updateSelectionFormat();
      return;
    }
    editor.formatText(
      range.index,
      range.length,
      'code',
      nextValue,
      'user'
    );
    this.updateSelectionFormat();
  }

  isLinkActive(): boolean {
    const editor = this.quillEditorInstance();
    if (!editor) return false;
    const range = editor.getSelection(false);
    if (!range) return false;
    const format = editor.getFormat(range);
    return Boolean(format['link']);
  }

  setLink() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    editor.focus();
    const range = editor.getSelection(true);
    if (!range) return;

    if (this.popupVisible() && this.popupMode() === 'toolbar') {
      const format = editor.getFormat(range);
      const linkValue = typeof format.link === 'string' ? format.link : '';
      this.linkUrl.set(linkValue);
      this.savedRange.set(range);
      this.lastPopupMode.set(this.popupMode());
      this.showPopup('insert-link');
      this.focusLinkInputWithSelection(range);
      return;
    }
  }

  confirmLink(event?: Event) {
    event?.preventDefault();
    const editor = this.quillEditorInstance();
    if (!editor) return;
    const range =
      this.savedRange() || editor.getSelection(true);
    const url = this.linkUrl().trim();
    if (!range || !url) {
      this.savedRange.set(null);
      this.hidePopup();
      return;
    }

    if (range.length > 0) {
      // Creating a new link on selected text
      editor.formatText(
        range.index,
        range.length,
        'link',
        url,
        'user'
      );
    } else {
      // Check if we're editing an existing link
      const linkRange = this.getFullLinkRange(range);
      if (linkRange) {
        // Editing existing link - apply to full link range
        editor.formatText(
          linkRange.index,
          linkRange.length,
          'link',
          url,
          'user'
        );
      } else {
        // No selection and no existing link - format for future typing
        editor.format('link', url, 'user');
      }
    }

    this.savedRange.set(null);
    // Restore selection and let selection-change handler decide what to do with popup
    if (editor && range) {
      editor.setSelection(range.index, range.length, 'user');
    } else {
      this.hidePopup();
    }
  }

  cancelLink() {
    const rangeToRestore = this.savedRange();
    this.linkUrl.set('');
    this.savedRange.set(null);
    this.suppressPopupClose.set(true);
    const lastMode = this.lastPopupMode();
    const editor = this.quillEditorInstance();
    if (lastMode) {
      // Restore linkUrl when going back to edit-link or toolbar mode
      if (editor && rangeToRestore) {
        const format = editor.getFormat(rangeToRestore);
        const linkValue = typeof format.link === 'string' ? format.link : '';
        if (linkValue) {
          this.linkUrl.set(linkValue);
        }
      }
      this.showPopup(lastMode);
      setTimeout(() => {
        this.suppressPopupClose.set(false);
      }, 0);
      return;
    }
    // Restore selection when canceling
    if (editor && rangeToRestore) {
      editor.setSelection(
        rangeToRestore.index,
        rangeToRestore.length,
        'user'
      );
    }
    this.hidePopup();
    setTimeout(() => this.suppressPopupClose.set(false), 0);
  }

  editLink() {
    const editor = this.quillEditorInstance();
    if (editor) {
      const range = editor.getSelection(false);
      if (range) {
        this.savedRange.set(range);
        this.focusLinkInputWithSelection(range);
      }
    }
    this.showPopup('insert-link');
  }

  private focusLinkInputWithSelection(range: Range) {
    requestAnimationFrame(() => {
      const editor = this.quillEditorInstance();
      if (editor) {
        editor.setSelection(
          range.index,
          range.length,
          'user'
        );
      }
      this.linkInputRef()?.nativeElement.focus();
    });
  }

  removeLink() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    const range = editor.getSelection(true);
    if (!range) return;

    const linkRange = this.getFullLinkRange(range);
    if (!linkRange) return;

    editor.formatText(
      linkRange.index,
      linkRange.length,
      'link',
      false,
      'user'
    );

    this.linkUrl.set('');
    this.savedRange.set(null);
    this.hidePopup();
  }

  private getFullLinkRange(range: Range): Range | null {
    const editor = this.quillEditorInstance();
    if (!editor) return null;
    const currentFormat = editor.getFormat(range);
    const linkValue =
      typeof currentFormat.link === 'string' ? currentFormat.link : '';
    if (!linkValue) return null;

    const [leaf] = editor.getLeaf(range.index);
    if (!leaf) {
      return { index: range.index, length: Math.max(range.length, 1) };
    }

    const isLinkBlot = (blot: Blot) => {
      const blotIndex = editor.getIndex(blot) ?? 0;
      const blotLength = Math.max(1, blot.length());
      const format = editor.getFormat(blotIndex, blotLength);
      return format?.link === linkValue;
    };

    let startBlot: Blot = leaf;
    let endBlot: Blot = leaf;

    while (startBlot?.prev && isLinkBlot(startBlot.prev)) {
      startBlot = startBlot.prev;
    }

    while (endBlot?.next && isLinkBlot(endBlot.next)) {
      endBlot = endBlot.next;
    }

    const startIndex = editor.getIndex(startBlot);
    const endIndex =
      editor.getIndex(endBlot) +
      Math.max(1, endBlot.length());

    return { index: startIndex, length: endIndex - startIndex };
  }

  onLinkUrlChange(value: string) {
    this.linkUrl.set(value);
  }

  onTextChange(event: { html: string | null }) {
    const html = event.html ?? '';
    this.messageText.set(html);
    const ids = Array.from(
      html.matchAll(/data-user-id="([^"]+)"/g),
      match => match[1]
    ).filter((id): id is string => Boolean(id));
    this.participants.set(ids);
    this.scheduleNormalizeLinks();
  }

  private scheduleNormalizeLinks() {
    if (this.normalizeLinksHandle !== null) {
      window.clearTimeout(this.normalizeLinksHandle);
    }
    this.normalizeLinksHandle = window.setTimeout(() => {
      this.normalizeLinks();
      this.normalizeLinksHandle = null;
    }, 50);
  }

  private normalizeLinks() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    const anchors = editor.root.querySelectorAll('a');
    anchors.forEach(anchor => {
      anchor.classList.add('comment-external-link');
      anchor.setAttribute('rel', 'noopener noreferrer');
      anchor.setAttribute('target', '_blank');
    });
  }

  onFocus() {
    if (this.isOwner()) {
      this.isDirty.set(true);
    }
  }

  setText(newText: string) {
    const editor = this.quillEditorInstance();
    if (editor) {
      editor.setContents([]);
      const clean = DOMPurify.sanitize(newText ?? '', {
        ADD_ATTR: [
          'data-id',
          'data-value',
          'data-denotation-char',
          'data-user-id',
          'data-mention',
          'data-index',
          'contenteditable',
        ],
      });
      editor.clipboard.dangerouslyPasteHTML(clean, 'silent');
      this.messageText.set(clean);
      return;
    }
    this.messageText.set(newText ?? '');
  }

  focusOnInput() {
    this.quillEditorInstance()?.focus();
  }

  private toMentionItem(user: TaggedUser): MentionItem {
    const value = user.text.replace(/^@/, '').trim();
    return {
      id: user.id,
      value,
      denotationChar: '@',
      userId: user.userId,
      mention: `@${value}`,
    };
  }

  private getUserNames(searchTerm: string): Promise<TaggedUser[]> {
    const allUsers: TaggedUser[] = [];
    const businesses = this.users().filter(
      user =>
        user.userType !== RequestUserTypes.INDIVIDUAL && user.disabled === false
    );
    const individualUsers = this.users().filter(
      user =>
        user.userType === RequestUserTypes.INDIVIDUAL && user.disabled === false
    );

    businesses.forEach(user => {
      const businessUsers = user.profile?.users as RequestUser[];
      businessUsers.forEach(businessUser => {
        if (
          businessUser.userId === this.activeUser()?.activeOrganizationUserId
        ) {
          return;
        }
        if ('firstName' in businessUser) {
          const { firstName = '', lastName = '' } = businessUser;
          const fullName = `${firstName} ${lastName}`.toLowerCase();
          if (fullName.includes(searchTerm.toLowerCase())) {
            allUsers.push({
              id: `@${businessUser.firstName ?? ''} ${businessUser.lastName ?? ''}`,
              text: `@${businessUser.firstName ?? ''} ${businessUser.lastName ?? ''}`,
              userId: businessUser.userId ?? '',
            });
          }
        }
      });
    });

    individualUsers.forEach(user => {
      const individualUser = user as RequestUser;
      if (
        individualUser.userId === this.activeUser()?.activeOrganizationUserId
      ) {
        return;
      }
      if (individualUser.profile && 'firstName' in individualUser.profile) {
        const { firstName = '', lastName = '' } = individualUser.profile;
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        if (fullName.includes(searchTerm.toLowerCase())) {
          allUsers.push({
            id: `@${fullName}`,
            text: `@${fullName}`,
            userId: individualUser.userId ?? '',
          });
        }
      }
    });

    // Fetch employee users from the organization service only if enableEmployeeSearch is true
    // and (searchTerm >= 4 chars or allUsers is empty)
    if (
      this.enableEmployeeSearch() &&
      (searchTerm.length >= 4 || allUsers.length === 0)
    ) {
      return firstValueFrom(
        this.organizationService.searchUsers(searchTerm, true)
      )
        .then((employeeUsers: UserProfile[]) => {
          employeeUsers.forEach((employee: UserProfile) => {
            // Skip if it's the active user
            if (
              employee.userId === this.activeUser()?.activeOrganizationUserId
            ) {
              return;
            }
            // Skip if user is already in the list
            if (allUsers.some(u => u.userId === employee.userId)) {
              return;
            }
            const { firstName = '', lastName = '' } = employee;
            const fullName = `${firstName} ${lastName}`;
            const newParticipant = {
              id: `@${fullName}`,
              text: `@${fullName}`,
              userId: employee.id ?? '',
            };
            allUsers.push(newParticipant);
            this.participants.update(previous => [
              ...previous,
              newParticipant.userId,
            ]);
          });
          return allUsers;
        })
        .catch(() => {
          // If the API call fails, return the users we already have
          return allUsers;
        });
    }

    // Return allUsers without calling searchUsers
    return Promise.resolve(allUsers);
  }

  updateSelectionFormat() {
    const editor = this.quillEditorInstance();
    if (!editor) return;
    const range = editor.getSelection(false);
    if (!range) return;
    const format = editor.getFormat(range);
    this.selectionFormat.set({
      boldActive: Boolean(format['bold']),
      codeActive: Boolean(format['code']),
      italicActive: Boolean(format['italic']),
      linkActive: Boolean(format['link']),
    });
  }

  handleSelectionChange({
    editor,
    range,
  }: {
    editor: Quill;
    range: Range | null;
    oldRange: Range | null;
  }) {
    this.updateSelectionFormat();

    if (!range) {
      if (this.shouldHidePopup()) {
        this.hidePopup();
      }
      return;
    }

    // If we're in insert-link mode and the selection changes, clear saved range and recalculate
    if (this.popupMode() === 'insert-link') {
      this.savedRange.set(null);
    }

    // Clear insert format when cursor is at the end with no selection
    const editorInstance = this.quillEditorInstance();
    if (range.length === 0 && editorInstance) {
      const docLength = editorInstance.getLength();
      if (range.index === docLength - 1) {
        // Clear all formatting for future typing
        editorInstance.format('bold', false, 'user');
        editorInstance.format('italic', false, 'user');
        editorInstance.format('code', false, 'user');
        editorInstance.format('link', false, 'user');
      }
    }

    const hasLink = this.isLinkActive();
    const hasSelection = range.length > 0;
    const nextMode: PopupModes = hasSelection
      ? 'toolbar'
      : hasLink
        ? 'edit-link'
        : null;

    if (!nextMode) {
      this.hidePopup();
      return;
    }

    const selectionRect = this.getFirstLineSelectionRect(editor, range);
    if (!selectionRect) {
      this.hidePopup();
      return;
    }

    if (hasLink) {
      const format = editor.getFormat(range);
      const linkValue = typeof format.link === 'string' ? format.link : '';
      this.linkUrl.set(linkValue);
    }

    const virtualElement = this.createSelectionVirtualElement(selectionRect);
    this.lastVirtualElement = virtualElement;

    this.showPopup(nextMode);

    this.updatePosition(virtualElement);
    this.schedulePositionUpdate();
  }

  private showPopup(mode: PopupModes): void {
    this.deferSignalUpdate(() => {
      if (mode && mode !== 'insert-link') {
        this.lastPopupMode.set(mode);
      }
      this.popupVisible.set(true);
      this.popupMode.set(mode);
      this.schedulePositionUpdate();
    });
  }

  shouldHidePopup(): boolean {
    if (this.popupFocused()) {
      return false;
    }
    if (['insert-link'].includes(this.popupMode() ?? '')) {
      return false;
    }
    if (this.suppressPopupClose()) {
      return false;
    }
    return true;
  }

  /** Hides the floating toolbar popup. */
  private hidePopup(): void {
    this.deferSignalUpdate(() => {
      this.popupVisible.set(false);
      this.popupMode.set(null);
      this.lastVirtualElement = null;
    });
  }

  private deferSignalUpdate(update: () => void) {
    queueMicrotask(update);
  }

  private schedulePositionUpdate(): void {
    if (!this.lastVirtualElement) return;
    requestAnimationFrame(() => {
      if (!this.lastVirtualElement) return;
      this.updatePosition(this.lastVirtualElement);
    });
  }

  /**
   * Creates a "virtual element" representing the current selection for positioning tooltips.
   * A virtual element is an object that has a getBoundingClientRect method, which returns
   * the bounding rectangle of the selection.
   *
   * @param rect
   * @returns
   */
  private createSelectionVirtualElement(rect: DOMRect): VirtualElement {
    return {
      getBoundingClientRect: () => rect,
    };
  }

  /**
   * Gets the bounding rectangle of the first line of the current selection.
   * This is used to position tooltips and popups relative to the selection.
   *
   * @param editor
   * @param range
   * @returns
   */
  private getFirstLineSelectionRect(
    editor: Quill,
    range: { index: number; length: number }
  ): DOMRect | null {
    const documentSelection = editor.root.ownerDocument?.getSelection();
    if (documentSelection && documentSelection.rangeCount > 0) {
      const domRange = documentSelection.getRangeAt(0);
      const rects = Array.from(domRange.getClientRects());
      return rects?.at(0) ?? null;
    }

    const bounds = editor.getBounds(range.index, Math.max(range.length, 1));
    if (!bounds) return null;
    const editorRect = editor.root.getBoundingClientRect();
    const left = editorRect.left + bounds.left;
    const top = editorRect.top + bounds.top;
    return new DOMRect(left, top, bounds.width, bounds.height);
  }

  /**
   * Updates the position of the floating element relative to the virtual element.
   * Uses Floating UI to compute the position.
   *
   * @param virtualElement
   * @returns
   */
  private updatePosition(virtualElement: VirtualElement): void {
    const floatingElement = this.floatingElementRef()?.nativeElement;
    if (!floatingElement) return;
    const arrowElement = this.arrowElementRef()?.nativeElement ?? null;

    computePosition(virtualElement, floatingElement, {
      placement: 'bottom',
      middleware: [
        offset(10),
        shift({ padding: 5 }),
        ...(arrowElement ? [arrow({ element: arrowElement })] : []),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      Object.assign(floatingElement.style, {
        left: `${x}px`,
        top: `${y}px`,
        display: 'block',
      });

      if (arrowElement && middlewareData.arrow) {
        const { x: arrowX, y: arrowY } = middlewareData.arrow;
        const basePlacement = placement.split('-')[0];
        const staticSide =
          basePlacement === 'top'
            ? 'bottom'
            : basePlacement === 'bottom'
              ? 'top'
              : basePlacement === 'left'
                ? 'right'
                : 'left';

        Object.assign(arrowElement.style, {
          left: arrowX || arrowX === 0 ? `${arrowX}px` : '',
          top: arrowY || arrowY === 0 ? `${arrowY}px` : '',
          right: '',
          bottom: '',
          [staticSide]: '-4px',
        });
      }
    });
  }
}
