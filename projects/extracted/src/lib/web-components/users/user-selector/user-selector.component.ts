import { ChangeDetectionStrategy, Component, input, OnInit, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime } from 'rxjs';
import { AvatarComponent } from '../../../design-system';
import * as StringUtil from '../../../utils/stringUtil';
import { UserProfile } from '../../../models/userModels';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'lj-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
  imports: [FormsModule, MatInputModule, MatIcon, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSelectorComponent implements OnInit {
  private organizationService = inject(OrganizationService);

  employeesOnly = input<boolean>(false);
  customersOnly = input<boolean>(false);
  groups = input<string[]>([]);
  scrollResults = input(true);
  excludeIds = input<string[]>([]);
  clearOnSelection = input(false);

  modelChanged: Subject<string> = new Subject<string>();

  id: string = StringUtil.getRandomString(12);
  searchExpression = '';
  debounceTime = 200;
  users = signal<UserProfile[]>([]);

  readonly userSelected = output<UserProfile>();

  ngOnInit() {
    this.modelChanged.pipe(debounceTime(this.debounceTime)).subscribe(() => {
      this.search();
    });
  }

  registerModelChange() {
    this.modelChanged.next(this.searchExpression);
  }

  search() {
    this.organizationService
      .searchUsers(this.searchExpression, this.employeesOnly(), this.groups())
      .subscribe({
        next: (users: UserProfile[]) => {
          this.users.set(
            users.filter(u => !this.excludeIds().includes(u.id ?? ''))
          );
        },
        error: () => {
          this.users.set([]);
        },
      });
  }

  formatName(user: UserProfile): string {
    return `${user.firstName} ${user.lastName}`;
  }

  userClicked(user: UserProfile) {
    this.userSelected.emit(user);

    if (this.clearOnSelection()) {
      this.searchExpression = '';
      this.users.set([]);
    }
  }

  public focus() {
    document.getElementById(this.id)?.focus();
  }
}
