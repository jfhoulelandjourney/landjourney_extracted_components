import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lj-page',
  imports: [],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {}
