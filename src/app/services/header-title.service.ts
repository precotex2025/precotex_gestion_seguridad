import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HeaderTitleInfo {
  title: string;
  breadcrumb?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HeaderTitleService {
  private titleSubject = new BehaviorSubject<HeaderTitleInfo | null>(null);
  public title$: Observable<HeaderTitleInfo | null> = this.titleSubject.asObservable();

  getCurrentTitle(): HeaderTitleInfo | null {
    return this.titleSubject.getValue();
  }

  setTitle(info: HeaderTitleInfo | null): void {
    this.titleSubject.next(info);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('precotex:header-title-change', { detail: info }));
    }
  }

  resetTitle(): void {
    this.titleSubject.next(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('precotex:header-title-change', { detail: null }));
    }
  }
}
