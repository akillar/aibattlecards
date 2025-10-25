import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GetMoreScreenMostViewedProductStateService {
  private state: any[] | null = null;

  saveState(data: any[]): void {
    this.state = data;
  }

  getState(): any[] | null {
    return this.state;
  }

  clearState(): void {
    this.state = null;
  }
}
