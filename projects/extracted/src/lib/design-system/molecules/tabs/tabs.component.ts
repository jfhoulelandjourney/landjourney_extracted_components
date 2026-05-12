import { Component, ContentChildren, QueryList, AfterContentInit, TemplateRef, ChangeDetectionStrategy, Directive, signal, model, input, inject } from '@angular/core';
import { ActivateDirective } from '../../../directives/activate/activate.directive';
import { NgTemplateOutlet } from '@angular/common';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[tab]',
  standalone: true,
})
export class TabDirective {
  template = inject<TemplateRef<unknown>>(TemplateRef);

  label = input.required<string>();
}

@Component({
  selector: 'lj-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  imports: [ActivateDirective, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabDirective) tabDirectives!: QueryList<TabDirective>;

  tabs = signal<{ label: string; content: TemplateRef<unknown> }[]>([]);
  activeTabIndex = model(0);
  centered = input(false);

  ngAfterContentInit(): void {
    this.tabs.set(
      this.tabDirectives.map(tab => ({
        label: tab.label(),
        content: tab.template,
      }))
    );
  }

  selectTab(index: number): void {
    this.activeTabIndex.set(index);
  }
}
