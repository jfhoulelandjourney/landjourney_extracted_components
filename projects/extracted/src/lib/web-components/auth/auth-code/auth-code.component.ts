import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IAMService } from '../../../services/identity/iam.service';

@Component({
  selector: 'landjourney-auth-code',
  templateUrl: './auth-code.component.html',
  styleUrls: ['./auth-code.component.scss'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCodeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private iamService = inject(IAMService);
  private router = inject(Router);


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token: string = params['token'];
      const path: string | undefined = params['path'];
      const organization: string | undefined = params['organization'];

      if (token) {
        this.iamService.completeLoginWithLink(token, path, organization);
      } else {
        this.router.navigateByUrl('/login');
      }
    });
  }
}
