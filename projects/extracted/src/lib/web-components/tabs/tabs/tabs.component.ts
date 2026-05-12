import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  input,
  output,
  signal,
} from '@angular/core';
import { Tab } from '../tab.models';
import { LjTabComponent } from '../tab/tab.component';

@Component({
  selector: 'lj-tabs',
  imports: [],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tablist',
    '(click)': 'handleTabInteraction($event)',
    '(keydown.space)': 'handleTabInteraction($event)',
    '(keydown.enter)': 'handleTabInteraction($event)',
  },
})
export class LjTabsComponent {
  readonly activeTab = input<Tab | undefined>(undefined);

  currentTab = signal<Tab | undefined>(undefined);
  tabs = contentChildren(LjTabComponent);
  tabsElementRef = contentChildren(LjTabComponent, {
    read: ElementRef<HTMLElement>,
  });
  private selectedTabIndex = computed(() => {
    const tabs = this.tabs();
    return tabs.findIndex(tab => tab.selected());
  });

  readonly selectedTab = output<Tab>();

  constructor() {
    effect(() => {
      const external = this.activeTab();
      const tabComponents = this.tabs();
      if (tabComponents.length === 0) {
        return;
      }

      if (external !== undefined && external !== null) {
        this.selectTab(external, false);
        return;
      }

      if (this.currentTab() === undefined) {
        const firstName = tabComponents.at(0)?.name();
        if (firstName !== undefined && firstName !== null) {
          this.selectTab(firstName, false);
        }
      }
    });
  }

  selectTab(tabName: Tab, emit = true) {
    const tabs = this.tabs();
    const tab = tabs.find(t => t.name() === tabName);

    if (tabName === this.currentTab()) {
      return;
    }

    if (tab && !tab.disabled()) {
      tabs.forEach(tab => {
        const selected = tab.name() === tabName;
        if (tab.selected() !== selected) {
          tab.selected.set(selected);
        }
      });
      this.currentTab.set(tabName);

      if (emit) {
        this.selectedTab.emit(tabName);
      }
    }
  }

  nextTab() {
    const selectedTabIndex = this.selectedTabIndex();
    const tabs = this.tabs();

    if (selectedTabIndex < 0 || tabs.length === 0) {
      return;
    }

    if (selectedTabIndex < tabs.length - 1) {
      const tab = tabs[selectedTabIndex + 1];
      this.selectTab(tab?.name() ?? '');
    }
  }

  prevTab() {
    const selectedTabIndex = this.selectedTabIndex();
    const tabs = this.tabs();

    if (selectedTabIndex < 0 || tabs.length === 0) {
      return;
    }

    if (selectedTabIndex > 0) {
      const tab = tabs[selectedTabIndex - 1];
      this.selectTab(tab?.name() ?? '');
    }
  }

  protected handleTabInteraction(event: Event) {
    const tabs = this.tabs();
    const tabTarget = (event.target as HTMLElement | null)?.closest(
      'lj-tab'
    );
    if (!tabTarget) {
      return;
    }

    const tabIndex = this.tabsElementRef().findIndex(
      ref => ref.nativeElement === tabTarget
    );

    if (tabIndex !== -1) {
      this.selectTab(tabs.at(tabIndex)?.name() ?? '');
    }
  }
}
