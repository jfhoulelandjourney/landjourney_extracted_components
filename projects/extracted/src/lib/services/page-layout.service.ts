import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum PageLayouts {
  SPLASH = 'SPLASH',
}

@Injectable({
  providedIn: 'root',
})
export class PageLayoutService {
  private layoutSubject = new Subject<PageLayouts>();

  public layout$ = this.layoutSubject.asObservable();

  setLayout(value: PageLayouts) {
    this.layoutSubject.next(value);
  }
}
