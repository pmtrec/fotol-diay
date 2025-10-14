import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LayoutType = 'main' | 'auth' | 'error';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  // Layout par défaut = main
  private layoutSubject = new BehaviorSubject<LayoutType>('main');
  layout$ = this.layoutSubject.asObservable();

  setLayout(layout: LayoutType) {
    this.layoutSubject.next(layout);
  }

  getLayout(): LayoutType {
    return this.layoutSubject.value;
  }
}
