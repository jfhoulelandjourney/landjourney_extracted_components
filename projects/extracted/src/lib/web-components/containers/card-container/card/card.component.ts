
import { ChangeDetectionStrategy, Component, Input, OnInit, output, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AvatarComponent } from '../../../../design-system';
import { TagUtil } from '../../../../utils/tagUtil';
import { isNil } from '../../../../utils/nullishUtil';

@Component({
  selector: 'landjourney-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [RouterModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements OnInit {
  private router = inject(Router);

  @Input() iconsSrc: string[] = [];
  @Input() id: string | null = null;
  @Input() formattedId: string | null = null;
  @Input() title: string | null = null;
  @Input() subtitle: string | null = null;
  @Input() tags: string[] = [];
  @Input() amount: number | null = null;
  @Input() url: string | null = null;
  @Input() linkText: string | null = null;

  @Input() odd = false;
  @Input() showId = true;

  readonly onClick = output<string>();

  ngOnInit() {
    if (this.linkText && this.amount) {
      throw new Error("You can't specify both a linkText and an amount.");
    }

    if (isNil(this.formattedId)) {
      this.formattedId = this.id;
    }
  }

  navigate(): void {
    if (this.url) {
      this.router.navigateByUrl(this.url);
    }
  }

  click() {
    if (this.url && !this.linkText) {
      this.navigate();
    }

    this.onClick.emit(this.id || '');
  }

  getCssClassForTag(tag: string): string {
    return TagUtil.getCssClassForTag(tag);
  }
}
