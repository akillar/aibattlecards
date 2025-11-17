import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FeafuredProductStateService {
  private state: any[] | null = null;

  // Save most viewed products
  saveState(data: any[]): void {
    this.state = data;
  }

  // Get most viewed products
  getState(): any[] | null {
    return this.state;
  }

  // Clear most viewed products
  clearState(): void {
    this.state = null;
  }
}
