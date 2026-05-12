import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivateDirective } from '../../../../../directives/activate/activate.directive';
import {
  Directions,
  DynamicFormSection,
  SectionLayouts,
} from '../../../../models/dynamic-forms.models';

@Component({
  selector: 'lj-section-configuration',
  imports: [
    MatIcon,
    MatButtonModule,
    ActivateDirective,
    MatTooltipModule,
    MatSelectModule,
    MatMenuModule,
  ],
  templateUrl: './section-configuration.component.html',
  styleUrl: './section-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionConfigurationComponent {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger | undefined;

  section = input.required<DynamicFormSection>();
  options = input<{
    sectionLayout: boolean;
    sectionDirection: boolean;
    conditionalLogic: boolean;
  }>({
    sectionLayout: true,
    sectionDirection: true,
    conditionalLogic: true,
  });

  readonly handleSectionChange = output<DynamicFormSection>();
  readonly addConditionalLogic = output<void>();
  readonly remove = output<void>();

  handleLayoutChange(event: Event) {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const layout = select.value as SectionLayouts;
    const section = this.section();
    const previousLayout = section.layout;
    section.layout = layout;

    if (previousLayout === SectionLayouts.ONE_COLUMN) {
      // DO NOTHING
    }

    if (
      previousLayout === SectionLayouts.TWO_COLUMNS &&
      layout === SectionLayouts.THREE_COLUMNS
    ) {
      // DO NOTHING
    }

    if (
      previousLayout === SectionLayouts.THREE_COLUMNS &&
      layout === SectionLayouts.TWO_COLUMNS
    ) {
      section.fields = section.fields.map(element => {
        if (element.column === 2) {
          element.column = 1;
        }

        return element;
      });
    }

    if (
      [SectionLayouts.TWO_COLUMNS, SectionLayouts.THREE_COLUMNS].includes(
        previousLayout
      ) &&
      layout === SectionLayouts.ONE_COLUMN
    ) {
      section.fields = section.fields.map(element => {
        if ([1, 2].includes(element.column ?? 0)) {
          element.column = 0;
        }

        return element;
      });
    }

    this.handleSectionChange.emit(section);
  }

  handleDirectionChange(event: Event) {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    const direction = select.value as Directions;

    this.handleSectionChange.emit({
      ...this.section(),
      direction: direction,
    });
  }

  getCurrentLayout(): SectionLayouts {
    return this.section().layout || SectionLayouts.ONE_COLUMN;
  }

  getCurrentDirection(): Directions {
    return this.section().direction || Directions.COLUMN;
  }

  addDisplayCondition() {
    this.trigger?.closeMenu();
    this.addConditionalLogic.emit();
  }

  removeItem() {
    this.trigger?.closeMenu();
    this.remove.emit();
  }
}
