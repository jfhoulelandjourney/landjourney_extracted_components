
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'landjourney-small-card',
  templateUrl: './small-card.component.html',
  styleUrls: ['./small-card.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallCardComponent {
  private router = inject(Router);

  @Input() iconSrc: string | null = null;
  @Input() title: string | null = null;
  @Input() subtitle: string | null = null;
  @Input() url: string | null = null;
  @Input() linkText: string | null = null;
  @Input() backgroundImage: string | null = null;
  @Input() dark = false;
  @Input() shape = 'square';
  @Input() alignContent: 'left' | 'center' = 'left';

  navigate(): void {
    if (this.url) {
      this.router.navigateByUrl(this.url);
    }
  }
}
