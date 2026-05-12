import { ChangeDetectionStrategy, Component, computed, effect, input, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  ChecklistItem,
  ChecklistOutput,
} from '../../../models/documents/AiChatModel';
import { DocumentQueryAiService } from '../../../services/documents/document-query-ai.service';
import { ActivateDirective } from '../../../directives/activate/activate.directive';

@Component({
  selector: 'lj-checklist-table',
  templateUrl: './lj-checklist-table.component.html',
  styleUrls: ['./lj-checklist-table.component.scss'],
  imports: [MatIconModule, ActivateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LjChecklistTableComponent {
  private queryAiService = inject(DocumentQueryAiService);

  checklist = input<ChecklistOutput>();
  showHumanVerification = input<boolean>(true);
  checklistItems = computed(() => {
    const checklistItems = this.checklist()?.checklist.checklistItems || [];
    const checklistOutput =
      this.checklist()?.verificationOutput.checklistVerification || [];
    if (!checklistItems.length) {
      return [];
    }

    return checklistItems.map(item => {
      const verification = checklistOutput.find(
        v => v.stepNumber === item.stepNumber
      );
      return {
        ...item,
        verified: Boolean(verification),
        passed: verification ? verification.passed : false,
      };
    });
  });
  private _humanVerification = signal<Record<string, boolean>>({});
  humanVerification = computed(() => this._humanVerification());
  openAccordionStep = signal<number | null>(null);

  constructor() {
    // Effect to sync humanVerification when checklist changes
    effect(
      () => {
        const checklist = this.checklist();
        if (checklist) {
          this._humanVerification.set(checklist.humanVerification || {});
        }
      },
      { allowSignalWrites: true }
    );
  }

  public isHumanVerified(step: ChecklistItem): boolean {
    const stepNumber = step.stepNumber.toString();
    return stepNumber in this.humanVerification();
  }
  public isHumanPassed(step: ChecklistItem): boolean {
    const stepNumber = step.stepNumber.toString();
    return this.humanVerification()[stepNumber] === true;
  }
  public isHumanFailed(step: ChecklistItem): boolean {
    const stepNumber = step.stepNumber.toString();
    return this.humanVerification()[stepNumber] === false;
  }

  public togglePass(step: ChecklistItem): void {
    const stepNumber = step.stepNumber.toString();
    const map = { ...this._humanVerification() };
    if (this.isHumanPassed(step)) {
      delete map[stepNumber];
    } else {
      map[stepNumber] = true;
    }
    this._humanVerification.set(map);
    this.updateHumanVerification();
  }

  public toggleFail(step: ChecklistItem): void {
    const stepNumber = step.stepNumber.toString();
    const map = { ...this._humanVerification() };
    if (this.isHumanFailed(step)) {
      delete map[stepNumber];
    } else {
      map[stepNumber] = false;
    }
    this._humanVerification.set(map);
    this.updateHumanVerification();
  }

  private updateHumanVerification(): void {
    const humanVerification = this._humanVerification();
    const checklistId = this.checklist()?.id;
    if (!checklistId) {
      console.error('Checklist ID is missing');
      return;
    }
    this.queryAiService
      .updateHumanVerification(checklistId, humanVerification)
      .subscribe({
        next: hv => this._humanVerification.set(hv),
        error: error =>
          console.error('Error updating human verification:', error),
      });
  }

  checklistOutputItems = computed(() => {
    return this.checklist()?.verificationOutput.checklistVerification || [];
  });

  openAccordion(stepNumber: number) {
    if (this.openAccordionStep() === stepNumber) {
      this.openAccordionStep.set(null);
    } else {
      this.openAccordionStep.set(stepNumber);
    }
  }

  closeAccordion() {
    this.openAccordionStep.set(null);
  }

  isAccordionOpen(stepNumber: number): boolean {
    return this.openAccordionStep() === stepNumber;
  }

  getChecklistOutputItem(stepNumber: number) {
    return this.checklistOutputItems().find(
      item => item.stepNumber === stepNumber
    );
  }
}
