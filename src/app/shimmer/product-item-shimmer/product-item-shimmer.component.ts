import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-item-shimmer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-item-shimmer.component.html',
  styleUrl: './product-item-shimmer.component.css'
})
export class ProductItemShimmerComponent {
  detailItems = Array(11).fill(0); // 11 detail rows
  reviewItems = Array(3).fill(0);  // 3 review cards
}