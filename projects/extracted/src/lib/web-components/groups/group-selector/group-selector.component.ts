import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit, output, signal, inject, effect } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import * as StringUtil from '../../../utils/stringUtil';
import { Group } from '../../../models/organizationModels';
import { OrganizationService } from '../../../services/organization/organization.service';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lj-group-selector',
  templateUrl: './group-selector.component.html',
  styleUrls: ['./group-selector.component.scss'],
  imports: [FormsModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupSelectorComponent implements OnInit {
  private organizationService = inject(OrganizationService);
  private changeDetection = inject(ChangeDetectorRef);

  workgroupsOnly = input<boolean>(false);
  excludeIds = input<string[]>([]);
  scrollResults = input(true);
  clearOnSelection = input(false);
  organizationId = input<string>();

  modelChanged: Subject<string> = new Subject<string>();

  id: string = StringUtil.getRandomString(12);
  searchExpression = '';
  debounceTime = 200;
  groups: Group[] = [];
  filteredGroups = signal<Group[]>([]);

  readonly groupSelected = output<Group>();

  constructor() {
    toObservable(this.excludeIds).subscribe({
      next: () => {
        this.search(this.searchExpression);
      },
    });

    effect(() => {
      this.workgroupsOnly();
      this.organizationId();
      this.loadGroups();
    });
  }

  ngOnInit() {
    this.modelChanged.pipe(debounceTime(this.debounceTime)).subscribe(() => {
      this.search(this.searchExpression);
    });
  }

  loadGroups() {
    this.organizationService.getGroups(this.workgroupsOnly(), this.organizationId()).subscribe({
      next: groups => {
        this.groups = groups.filter(group => {
          return (
            (group.workgroup && this.workgroupsOnly()) || !this.workgroupsOnly()
          );
        });

        this.search('');
      },
      error: () => {
        // Already handled
      },
    });
  }

  search(searchExpression: string) {
    this.searchExpression = searchExpression;

    const filteredGroups = this.groups.filter(group => {
      return (
        (group.name
          .toLowerCase()
          .includes(this.searchExpression.toLowerCase()) ||
          this.searchExpression.trim() === '') &&
        !this.excludeIds().includes(group.id || '')
      );
    });

    this.filteredGroups.set(structuredClone(filteredGroups));
    this.changeDetection.detectChanges();
  }

  groupClicked(group: Group) {
    this.groupSelected.emit(group);

    if (this.clearOnSelection()) {
      this.searchExpression = '';
      this.filteredGroups.set([]);
    }
  }

  public focus() {
    document.getElementById(this.id)?.focus();
    this.search(this.searchExpression);
  }
}
