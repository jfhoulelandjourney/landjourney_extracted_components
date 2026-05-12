import { Injectable, inject } from '@angular/core';
import { EnvironmentService } from '../environment/environment.service';

type ChatOptions = {
  app_id: string;
  user_id?: string;
  /**
   * Web2Chat has user_id as a default attribute but doesn't seem to work right now
   * This way, we are duplicating it, and sending under both attributes
   */
  userid?: string;
  organizationid?: string;
  name?: string;
  email?: string;
  sessionid?: string;
};

type SessionData = Omit<ChatOptions, 'app_id' | 'user_id'>;

declare global {
  interface Window {
    Chat?: (action: string, options: ChatOptions) => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class Web2ChatService {
  private environmentService = inject(EnvironmentService);
  private appId = 'kjZFADp4Y';
  private scriptId = 'web2chat-script';
  private $scriptTag: HTMLElement | null = null;
  private $iframeContainer: HTMLElement | null = null;
  private $chatButton: HTMLElement | null = null;
  private chatState: 'idle' | 'starting' | 'running' = 'idle';
  private chatHidden = false;
  private overlayObserver: MutationObserver | null = null;
  private containerObserver: MutationObserver | null = null;
  private overlayStyleTag: HTMLStyleElement | null = null;
  private elementsStyles = {
    iframe: {
      display: '',
    },
    button: {
      display: '',
    },
  };

  private loadScript(): Promise<void> {
    if (
      document.getElementById(this.scriptId) &&
      typeof window.Chat === 'function'
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://widget.web2chat.ai/widget/${this.appId}`;
      script.id = this.scriptId;
      script.onload = () => resolve();
      script.onerror = (err: unknown) => {
        console.error('Web2Chat script failed to load', err);
        script.remove();
        reject();
      };
      document.body.appendChild(script);
    });
  }

  private registerSession(session?: SessionData): void {
    if (typeof window.Chat === 'function') {
      window.Chat('boot', {
        ...session,
        app_id: this.appId,
        user_id: session?.userid,
      });
    }
  }

  /**
   * Web2Chat doesn't provide any API to stop/remove the chat once it's started.
   * This method is a workaround to override the chat via iframe and button.
   * **NOTE**: This is fragile and requires manual testing after web2chat upgrades.
   */
  private getChatHtmlElements(): void {
    const $iframe = document.querySelector(
      'iframe[src^="https://frontend.web2chat.ai"]'
    );
    this.$iframeContainer = $iframe?.parentElement ?? null;
    this.$chatButton = document.querySelector('[aria-label="Open Messenger"]');
    this.$scriptTag = document.getElementById(this.scriptId);

    if (this.environmentService.isLocal()) {
      if (!this.$iframeContainer || !this.$chatButton || !this.$scriptTag) {
        console.error(
          'Web2Chat elements are missing. Please check the chat widget.'
        );
      }
    }
  }

  private removeElements(): void {
    this.getChatHtmlElements();
    this.$iframeContainer?.remove();
    this.$chatButton?.remove();
    this.$scriptTag?.remove();
    this.$iframeContainer = null;
    this.$chatButton = null;
    this.$scriptTag = null;
  }

  start(session?: SessionData): Promise<boolean> {
    if (this.chatState !== 'idle') {
      return Promise.resolve(true);
    }

    this.chatState = 'starting';
    return this.loadScript()
      .then(() => {
        if (this.chatState === 'idle') {
          this.destroy();
          return false;
        }
        // We need to run this on the next tick
        // so Chat script have time to run and create the elements
        setTimeout(() => {
          this.registerSession(session);
          this.neutralizeOverlay();
          this.chatState = 'running';
        }, 0);
        return true;
      })
      .catch(() => {
        this.chatState = 'idle';
        return false;
      });
  }

  show() {
    if (!this.chatHidden) {
      return;
    }

    this.getChatHtmlElements();
    const iframeDisplay = this.elementsStyles.iframe.display;
    if (iframeDisplay) {
      this.$iframeContainer?.style.setProperty('display', iframeDisplay);
    } else {
      this.$iframeContainer?.style.removeProperty('display');
    }

    const chatButtonDisplay = this.elementsStyles.button.display;
    if (chatButtonDisplay) {
      this.$iframeContainer?.style.setProperty('display', chatButtonDisplay);
    } else {
      this.$iframeContainer?.style.removeProperty('display');
    }
  }

  hide() {
    this.getChatHtmlElements();
    // read
    this.elementsStyles = {
      iframe: {
        display: this.$iframeContainer?.style.getPropertyValue('display') ?? '',
      },
      button: {
        display: this.$chatButton?.style.getPropertyValue('display') ?? '',
      },
    };

    // write
    this.$iframeContainer?.style.setProperty('display', 'none');
    this.$chatButton?.style.setProperty('display', 'none');

    this.chatHidden = true;
  }

  private neutralizeOverlay(): void {
    this.overlayObserver?.disconnect();
    this.containerObserver?.disconnect();

    // Minimal CSS: only ensure the "Open Messenger" FAB button stays clickable
    if (!this.overlayStyleTag) {
      const style = document.createElement('style');
      style.textContent = `@media (max-width: 47.9375rem) {
  [aria-label="Open Messenger"] { pointer-events: auto !important; touch-action: manipulation !important; cursor: pointer !important; }
}`;
      document.head.appendChild(style);
      this.overlayStyleTag = style;
    }

    let updating = false;

    const syncPointerEvents = () => {
      if (window.innerWidth > 767) return;

      const iframe = document.querySelector('iframe[src*="web2chat"]');
      const container = iframe?.parentElement;
      if (!container || container.parentElement !== document.body) return;

      // Chat is open when opacity is "1", closed otherwise
      const isOpen = container.style.opacity === '1';
      const desired = isOpen ? 'auto' : 'none';

      if (container.style.getPropertyValue('pointer-events') !== desired) {
        updating = true;
        container.style.setProperty('pointer-events', desired, 'important');
        setTimeout(() => (updating = false), 0);
      }

      if (!this.containerObserver) {
        this.containerObserver = new MutationObserver(() => {
          if (updating) return;
          const open = container.style.opacity === '1';
          const need = open ? 'auto' : 'none';
          if (container.style.getPropertyValue('pointer-events') !== need) {
            updating = true;
            container.style.setProperty('pointer-events', need, 'important');
            setTimeout(() => (updating = false), 0);
          }
        });
        this.containerObserver.observe(container, { attributes: true, attributeFilter: ['style'] });
      }
    };

    syncPointerEvents();
    this.overlayObserver = new MutationObserver(() => syncPointerEvents());
    this.overlayObserver.observe(document.body, { childList: true });
  }

  destroy() {
    if (this.chatState === 'idle') {
      return;
    }
    this.overlayObserver?.disconnect();
    this.overlayObserver = null;
    this.containerObserver?.disconnect();
    this.containerObserver = null;
    this.overlayStyleTag?.remove();
    this.overlayStyleTag = null;
    this.removeElements();
    delete window.Chat;
    this.chatState = 'idle';
  }
}
