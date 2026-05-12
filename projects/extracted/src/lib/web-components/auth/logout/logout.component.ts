import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IAMService } from '../../../services/identity/iam.service';

@Component({
  selector: 'landjourney-logout',
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutComponent implements OnInit {
  private iamService = inject(IAMService);
  private router = inject(Router);


  ngOnInit(): void {
    this.iamService.logout();
    this.router.navigateByUrl('/login');
  }
}
