// review-card.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/getuserid.service';

export interface Review {
  id: number;
  reviewid: string;
  userid: string;
  productid: string;
  commercialorpersonal: string;
  howlong: string;
  experiencerate: string;
  comment: string;
  efficiencyrate: string;
  documentationrate: string;
  paidornot: string;
  paidrate?: string;
  colorcode: string;
  username: string;
  createddate: string;
  email?: string;
}

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Input() currentUserId: string = ''; // Pass from parent to check ownership
  @Input() showMenu: boolean = true; // Control menu visibility
  
  @Output() reviewDeleted = new EventEmitter<string>(); // Emit reviewid after deletion
  @Output() shareReview = new EventEmitter<Review>();
  @Output() reportReview = new EventEmitter<Review>();

  menuOpen: boolean = false;
  showDeleteConfirm: boolean = false;
  isDeleting: boolean = false;
  APIURL = environment.APIURL;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {

    this.currentUserId = this.authService.getUserid()!;
 
 
    if (this.review.userid !== this.currentUserId) {
      this.showMenu = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onUpdate() {
    this.menuOpen = false;
    // Navigate to product-item page with productid
    this.router.navigate(['/home/product-item'], {
      queryParams: { 
        productid: this.review.productid,
        edit: 'true',
        reviewid: this.review.reviewid
      }
    });
  }
 
  onDelete() {
    this.menuOpen = false;
    this.showDeleteConfirm = true;
  }

  async confirmDelete() {
    if (this.isDeleting) return;

 

    try {
      const payload = {
        reviewid: this.review.reviewid,
        userid: this.review.userid,
      };

      const response: any = await this.http.post(
        this.APIURL + 'delete_review',
        payload
      ).toPromise();

      if (response.message === 'deleted') {
        this.showDeleteConfirm = false;
        this.reviewDeleted.emit(this.review.reviewid);
      } else {
        alert('Failed to delete review. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('An error occurred while deleting the review.');
    } finally {
      this.isDeleting = false;
    }

 
 
    
  }






  onShare() {
    this.menuOpen = false;
    this.shareReview.emit(this.review);
  }

  onReport() {
    this.menuOpen = false;
    this.reportReview.emit(this.review);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-wrapper') && !target.closest('.modal-backdrop')) {
      this.menuOpen = false;
    }
  }

  getStars(rating: string | number): string {
    const numRating = typeof rating === 'string' ? parseInt(rating) || 0 : rating || 0;
    const clampedRating = Math.max(0, Math.min(5, numRating));
    const fullStars = '⭐'.repeat(clampedRating);
    const emptyStars = '☆'.repeat(5 - clampedRating);
    return fullStars + emptyStars;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }

  getUsageDurationText(duration: string): string {
    const durationMap: {[key: string]: string} = {
      '1-2 years': '1-2 years',
      '2-5 years': '2-5 years',
      '5+ years': '5+ years'
    };
    return durationMap[duration] || duration || 'Unknown duration';
  }

  getCommercialPersonalText(value: string): string {
    return value === 'yes' ? 'Commercial' : 'Personal';
  }

  getPaidVersionText(value: string): string {
    return value === 'yes' ? 'Paid' : 'Free';
  }

  getUserInitials(username: string): string {
    if (!username) return 'U';
    
    const names = username.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    
    return (firstInitial + lastInitial).toUpperCase();
  }
}