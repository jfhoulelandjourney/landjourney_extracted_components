/* eslint-disable @angular-eslint/component-selector */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'h1[lj-page-heading]',
  templateUrl: './page-heading.component.html',
  styleUrl: './page-heading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeadingComponent {}
