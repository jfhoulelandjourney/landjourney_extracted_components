import Quill from 'quill';
import { Mention, MentionBlot } from 'quill-mention';

// Extend Link creation to add custom class and attributes
const registerCommentLinkBlot = (() => {
  let registered = false;
  return () => {
    if (registered) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Link: any = Quill.import('formats/link');

    class CommentExternalLink extends Link {
      static create(value: string) {
        const node = super.create(value) as HTMLAnchorElement;
        node.classList.add('comment-external-link');
        node.setAttribute('rel', 'noopener noreferrer');
        node.setAttribute('target', '_blank');
        return node;
      }
    }

    CommentExternalLink.blotName = 'link';
    CommentExternalLink.tagName = 'A';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Quill.register(CommentExternalLink as any, true);
    registered = true;
  };
})();

// Register mention module once
const registerMentionModule = (() => {
  let registered = false;
  return () => {
    if (registered) return;
    Quill.register({
      'blots/mention': MentionBlot,
      'modules/mention': Mention,
    });
    registered = true;
  };
})();

registerCommentLinkBlot();
registerMentionModule();
