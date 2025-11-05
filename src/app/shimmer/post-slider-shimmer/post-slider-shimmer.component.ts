import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-slider-shimmer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-slider-shimmer.component.html',
  styleUrl: './post-slider-shimmer.component.css'
})
export class PostSliderShimmerComponent {
  @Input() cardCount: number = 5; // Number of shimmer cards to show
  
  get shimmerCards(): number[] {
    return Array(this.cardCount).fill(0);
  }
}