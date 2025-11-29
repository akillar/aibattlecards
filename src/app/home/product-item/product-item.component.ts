import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/getuserid.service';
import { LoadingComponent } from '../../widgets/loading/loading.component';
import { ReviewCardComponent } from '../../widgets/review-card/review-card.component';
import { ProductItemShimmerComponent } from '../../shimmer/product-item-shimmer/product-item-shimmer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ProductDetails {
  productimage: string;
  productname: string;
  productcategory: string;
  productlicense: string;
  producttechnology: string[];
  productwebsite: string;
  productdocumentation: string;
  productfundingstage: string;
  productdescription: string;
  xlink: string;
  userid: string;
  rating: number;
  productfb: string;
  productlinkedin: string;
  useCases: string[];
  founders: string[];
  baseModels: string[];
  deployments: string[];
  mediaPreviews: string[];
  repositories: string[];
}

interface Review {
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

interface RatingData {
  core_avg: number;
  paid_support_avg?: number;
  overall_score: number;
  weighted_rating: number;
  num_reviews: number;
}

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ProductItemShimmerComponent, ReviewCardComponent],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.css'
})
export class ProductItemComponent {
  showReviewForm: boolean = false;
  showPaidRating: boolean = false;

  reviewForm!: FormGroup;
  APIURL = environment.APIURL;
  productid: string = '';
  userid: string = '';
  ratings: number[] = [1, 2, 3, 4, 5];
  productDetails: ProductDetails | null = null;
  reviews: Review[] = [];
  showPopup: boolean = false;
  isLoading: boolean = false;
  isSubmittingReview: boolean = false;
  messageClass: string = '';
  message: string = '';
  messageVisible: boolean = false;
  
  // Pagination properties
  totalReviews: number = 0;
  currentOffset: number = 0;
  reviewsLimit: number = 5;
  hasMoreReviews: boolean = false;
  isLoadingMoreReviews: boolean = false;

  // Rating properties
  isCalculatingRating: boolean = false;
  ratingData: RatingData | null = null;
  isuserloggedin: boolean = false;
  isEditingReview: boolean = false;
  currentReviewId: string = '';

  // Media preview properties
  selectedMediaUrl: string | null = null;
  showMediaModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.reviewForm = this.fb.group({
      isPaid: ['', Validators.required],
      ispaidtogglecommercialorpersonal: ['', Validators.required],
      usageDuration: ['', Validators.required],
      experienceRating: [1, Validators.required],
      efficiencyRating: [1, Validators.required],
      documentationRating: [1, Validators.required],
      paidVersionRating: [1],
      additionalComments: ['']
    });

    this.route.queryParams.subscribe(params => {
      this.productid = params['productid'];
      this.userid = this.authService.getUserid()!;
      if (this.productid) {
        this.getProductDetails(this.productid);
        this.getReviews(this.productid, 0, true);
        this.calculateProductRating(this.productid);

        if (this.userid) { 
          this.isuserloggedin = true;
          this.checkExistingReview();
        } else {
          this.isuserloggedin = false;
        }
      }
    });
  }

  handleReviewDeleted(reviewid: string) {
    this.reviews = this.reviews.filter(review => review.reviewid !== reviewid);
    this.totalReviews--;
    this.showMessage('Review deleted successfully', 'success');
    if (this.productid) {
      this.calculateProductRating(this.productid);
    }
  }

  closeReviewFormModal(): void {
    this.showReviewForm = false;
  }

  async checkExistingReview(): Promise<void> {
    if (!this.userid || !this.productid) return;

    const payload = {
      productid: this.productid,
      userid: this.userid
    };

    this.http.post<any>(this.APIURL + 'check_existing_review', payload).subscribe({
      next: (response) => {
        if (response.message === "found") {
          this.isEditingReview = true;
          this.currentReviewId = response.review.reviewid;
          this.populateFormWithReview(response.review);
        } else {
          this.isEditingReview = false;
          this.currentReviewId = '';
        }
      },
      error: (error) => {
        this.isEditingReview = false;
      }
    });
  }

  populateFormWithReview(review: any): void {
    this.reviewForm.patchValue({
      ispaidtogglecommercialorpersonal: review.ispaidtogglecommercialorpersonal,
      usageDuration: review.usageDuration,
      experienceRating: review.experienceRating,
      efficiencyRating: review.efficiencyRating,
      documentationRating: review.documentationRating,
      isPaid: review.isPaid,
      paidVersionRating: review.paidVersionRating,
      additionalComments: review.additionalComments
    });

    this.showPaidRating = review.isPaid === 'yes';
  }

  async submitReview(): Promise<void> {
    if (this.reviewForm.invalid) {
      this.markFormGroupTouched(this.reviewForm);
      this.showMessage("Please fill in all required fields", "error");
      return;
    }

    this.isSubmittingReview = true;
    
    const formValues = this.reviewForm.value;
    const payload = {
      productid: this.productid,
      userid: this.userid,
      ispaidtogglecommercialorpersonal: formValues.ispaidtogglecommercialorpersonal,
      usageDuration: formValues.usageDuration,
      experienceRating: formValues.experienceRating,
      efficiencyRating: formValues.efficiencyRating,
      documentationRating: formValues.documentationRating,
      isPaid: formValues.isPaid,
      paidVersionRating: this.showPaidRating ? formValues.paidVersionRating : null,
      additionalComments: formValues.additionalComments
    };

    if (this.isEditingReview && this.currentReviewId) {
      (payload as any).reviewid = this.currentReviewId;
    }

    const endpoint = this.isEditingReview ? 'update_review' : 'add_review';
    const successMessage = this.isEditingReview ? 'Review updated successfully!' : 'Review added successfully!';

    this.http.post(this.APIURL + endpoint, payload).subscribe({
      next: (response: any) => {
        if (response.message === "added" || response.message === "updated") {
          if (this.productDetails && response.new_rating !== undefined) {
            this.productDetails.rating = response.new_rating;
          }

          this.reviewForm.reset();
          this.reviewForm.patchValue({
            experienceRating: 1,
            efficiencyRating: 1,
            documentationRating: 1,
            paidVersionRating: 1
          });
          this.showReviewForm = false;
          this.showPaidRating = false;
          
          this.currentOffset = 0;
          this.getReviews(this.productid, 0, true);
          
          this.calculateProductRating(this.productid);
          
          if (!this.isEditingReview) {
            this.isEditingReview = true;
            this.currentReviewId = response.reviewid;
          }
          
          this.showMessage(successMessage, "success");
        } else if (response.message === "review_exists") {
          this.isEditingReview = true;
          this.currentReviewId = response.existing_review.reviewid;
          this.populateFormWithReview(response.existing_review);
          this.showMessage("You already have a review for this product. Form populated with existing data for editing.", "error");
        } else {
          this.showMessage(`Failed to ${this.isEditingReview ? 'update' : 'add'} review. Please try again.`, "error");
        }
        this.isSubmittingReview = false;
      },
      error: (error) => {
        this.isSubmittingReview = false;
        let errorMessage = `Error ${this.isEditingReview ? 'updating' : 'submitting'} review. Please try again.`;
        if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        }
        this.showMessage(errorMessage, "error");
      }
    });
  }

  toggleReviewForm() {
    this.showReviewForm = !this.showReviewForm;
    
    if (this.showReviewForm && this.isEditingReview && this.currentReviewId) {
      this.checkExistingReview();
    }
  }

  async getReviews(productid: string, offset: number = 0, reset: boolean = false): Promise<void> {
    if (!reset) {
      this.isLoadingMoreReviews = true;
    }

    const payload = { 
      productid,
      offset,
      limit: this.reviewsLimit
    };

    this.http.post<any>(this.APIURL + 'get_reviews', payload).subscribe({
      next: (response) => {
        if (response.message === "found") {
          if (reset) {
            this.reviews = response.reviews || [];
            this.currentOffset = response.limit || this.reviewsLimit;
          } else {
            this.reviews = [...this.reviews, ...(response.reviews || [])];
            this.currentOffset += (response.reviews || []).length;
          }
          
          this.totalReviews = response.total_reviews || 0;
          this.hasMoreReviews = response.has_more || false;
        } else {
          if (reset) {
            this.reviews = [];
            this.totalReviews = 0;
            this.hasMoreReviews = false;
            this.currentOffset = 0;
          }
        }
        
        if (!reset) {
          this.isLoading = false;
          this.isLoadingMoreReviews = false;
        }
      },
      error: (error) => {
        console.error('❌ Error fetching reviews:', error);
        if (reset) {
          this.reviews = [];
          this.totalReviews = 0;
          this.isLoading = false;
          this.hasMoreReviews = false;
        } else {
          this.isLoading = false;
          this.isLoadingMoreReviews = false;
        }
      }
    });
  }

  async calculateProductRating(productid: string): Promise<void> {
    this.isCalculatingRating = true;
    const payload = { productid };

    this.http.post<any>(this.APIURL + 'calculate_product_rating', payload).subscribe({
      next: (response) => {
        if (response.message === "calculated") {
          this.ratingData = {
            core_avg: response.core_avg || 0,
            paid_support_avg: response.paid_support_avg,
            overall_score: response.overall_score || 0,
            weighted_rating: response.weighted_rating || 0,
            num_reviews: response.num_reviews || 0
          };
          
          if (this.productDetails) {
            this.productDetails.rating = response.weighted_rating || 0;
          }
        } else if (response.message === "no_reviews") {
          this.ratingData = {
            core_avg: 0,
            overall_score: 0,
            weighted_rating: 0,
            num_reviews: 0
          };
          
          if (this.productDetails) {
            this.productDetails.rating = 0;
          }
        }
        this.isCalculatingRating = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error calculating rating:', error);
        this.isCalculatingRating = false;
        this.ratingData = {
          core_avg: 0,
          overall_score: 0,
          weighted_rating: 0,
          num_reviews: 0
        };
        if (this.productDetails) {
          this.productDetails.rating = 0;
        }
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageClass = type === 'success' ? 'green-good' : 'red-bad';
    this.messageVisible = true;

    setTimeout(() => {
      this.messageVisible = false;
    }, 3000);
  }

  loadMoreReviews(): void {
    if (this.hasMoreReviews && !this.isLoadingMoreReviews) {
      this.getReviews(this.productid, this.currentOffset, false);
    }
  }

  openPopup(): void {
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
  }

  async getProductDetails(productid: string): Promise<void> {
    this.isLoading = true;
    const payload = { productid };

    this.http.post(this.APIURL + 'get_product_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === "yes") {
          this.isLoading = false;
          const prod = response.product;
          this.productDetails = {
            productimage: prod.productimage ? `data:image/jpeg;base64,${prod.productimage}` : '../../../assets/images/12.png',
            productname: prod.productname || 'Unknown Product',
            userid: prod.userid || '',
            productcategory: prod.productcategory || '',
            productdescription: prod.productdescription || '',
            rating: prod.rating || 0,
            productlicense: prod.productlicense || '',
            producttechnology: prod.producttechnology ? [prod.producttechnology] : [],
            productwebsite: prod.productwebsite || '',
            productfundingstage: prod.productfundingstage || '',
            productfb: prod.productfacebook || '',
            productlinkedin: prod.productlinkedin || '',
            productdocumentation: prod.productdocumentation || '',
            xlink: prod.xlink || '',
            useCases: response.useCases || [],
            founders: response.founders || [],
            baseModels: response.baseModels || [],
            deployments: response.deployments || [],
            mediaPreviews: response.mediaPreviews || [],
            repositories: response.repositories || [],
          };
        } else {
          console.warn("No product found");
          this.showMessage("Product not found", "error");
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error fetching product details:', error);
        this.showMessage("Error loading product details", "error");
      }
    });
  }

  togglePaidRating(show: boolean) {
    this.showPaidRating = show;
    if (!show) {
      this.reviewForm.get('paidVersionRating')?.setValue(1);
    }
  }

  togglecommercialorpersonal(show: boolean) {
    // This method can be used for additional logic if needed
  }

  setRating(controlName: string, value: number) {
    this.reviewForm.get(controlName)?.setValue(value);
  }

  // Helper methods for template
  getStars(rating: string | number): string {
    const numRating = typeof rating === 'string' ? parseInt(rating) || 0 : rating || 0;
    const clampedRating = Math.max(0, Math.min(5, numRating));
    const fullStars = '⭐'.repeat(clampedRating);
    const emptyStars = '☆'.repeat(5 - clampedRating);
    return fullStars + emptyStars;
  }

  getProductRatingStars(rating: number): string {
    const roundedRating = Math.max(0, Math.min(5, Math.round(rating || 0)));
    const fullStars = '★'.repeat(roundedRating);
    const emptyStars = '☆'.repeat(5 - roundedRating);
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

  getRatingColor(rating: number): string {
    const safeRating = rating || 0;
    if (safeRating >= 4.5) return '#4CAF50';
    if (safeRating >= 3.5) return '#FF9800';
    if (safeRating >= 2.5) return '#FFC107';
    return '#F44336';
  }

  hasValidRatingData(): boolean {
    return this.ratingData !== null && this.ratingData.num_reviews > 0;
  }

  getSafeRating(): number {
    return this.productDetails?.rating || 0;
  }

  // Media preview helper methods
  isYouTubeLink(url: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl {
    if (!url) return '';
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
    
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  getYouTubeThumbnail(url: string): string {
    if (!url) return '../../../assets/images/youtube.png';
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
    
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '../../../assets/images/youtube.png';
  }

  isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getDomainName(url: string): string {
    if (!url) return 'Link';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Link';
    }
  }

  openMediaModal(url: string): void {
    this.selectedMediaUrl = url;
    this.showMediaModal = true;
  }

  closeMediaModal(): void {
    this.showMediaModal = false;
    this.selectedMediaUrl = null;
  }
}