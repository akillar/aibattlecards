import { Component, HostListener, OnInit } from '@angular/core';
import { SmallerProductCardComponent } from '../../widgets/smaller-product-card/smaller-product-card.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ReviewCardComponent } from '../../widgets/review-card/review-card.component'; 
import { Router } from '@angular/router';
import { ReviewShimmerComponent } from '../../shimmer/review-shimmer/review-shimmer.component';

interface Tool {
  productimage: string;
  productname: string;
  productid: string;
  productcategory: string;
  productdescription: string;
  productfundingstage: string;
  productlicense: string;
  rating: string;
  producttechnology: string;
  productwebsite: string;
  productlinkedin: string;
  productfacebook: string;
  productdocumentation: string;
  productusecase: string[];
  repositories: string[];
  showDropdown?: boolean;
  selected?: number;
  reviewCount?: number;
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

@Component({
  selector: 'app-battle-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewCardComponent,ReviewShimmerComponent],
  templateUrl: './battle-card.component.html',
  styleUrl: './battle-card.component.css'
})

export class BattleCardComponent implements OnInit{

  constructor(private http: HttpClient, private router:Router) { }
  ngOnInit(): void {
window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toolsArray: Tool[] = [];
  searchTerm: string = '';
  filteredTools: Tool[] = [];
  selectedCategory: string = '';

  selectedTypeTools: Tool[] = [];
  displayedTypeTools: Tool[] = [];
  filterTerm: string = '';

  // Pagination properties for tools
  currentToolsOffset: number = 0;
  toolsLimit: number = 12; // First load: 12 items
  loadMoreLimit: number = 10; // Subsequent loads: 10 items
  hasMoreTools: boolean = false;
  isLoadingMoreTools: boolean = false;

  selectedTools: Tool[] = [];
  displayedSelectedTools: Tool[] = [];
  selectedFilterTerm: string = '';

  popupSelected: Tool[] = [];
  isproductisselectedfromsearch: boolean = true;
  isSearchingAnythingElseProduct: boolean = false;
  iscategoryselected: boolean = false;
  APIURL = environment.APIURL;
  noData: boolean = false;

  isLoading: boolean = false;
  isSubmittingReview: boolean = false;
  messageClass: string = '';

  // Pagination properties for reviews
  totalReviews: number = 0;
  currentOffset: number = 0;
  reviewsLimit: number = 5;
  hasMoreReviews: boolean = false;
  isLoadingMoreReviews: boolean = false;
  reviews: Review[] = [];
  currentProductId: string | null = null;

  // Image preview modal properties
  imagePreviewModal: boolean = false;
  previewImageSrc: string = '';
  previewImageAlt: string = '';
 shimmerArray = Array(4).fill(0); // Show 5 shimmer cards initially
  loadMoreShimmerArray = Array(2).fill(0);
  

  openReview(tool: Tool) {
    this.popupSelected = [tool];
    this.reviews = [];
    this.totalReviews = 0;
    this.currentOffset = 0;
    this.currentProductId = tool.productid;
    this.getReviews(this.currentProductId, 0, true);
  }

  loadMoreReviews(): void {
    if (this.hasMoreReviews && !this.isLoadingMoreReviews && this.currentProductId) {
      this.getReviews(this.currentProductId, this.currentOffset, false);
    }
  }
handleReviewDeleted(reviewid: string) {
  this.reviews = this.reviews.filter(review => review.reviewid !== reviewid);
  this.totalReviews--;
}
async getReviews(productid: string, offset: number = 0, reset: boolean = false): Promise<void> {
    if (reset) {
      this.isLoading = true;
      this.reviews = []; // Clear reviews immediately when loading
    } else {
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

        this.isLoading = false;
        this.isLoadingMoreReviews = false;
      },
      error: (error) => {
        console.error('❌ Error fetching reviews:', error);
        this.isLoading = false;
        this.isLoadingMoreReviews = false;
        
        if (reset) {
          this.reviews = [];
          this.totalReviews = 0;
          this.hasMoreReviews = false;
        }
      }
    });
  }

  async onCategoryChange(): Promise<void> {
    const newCategory = this.selectedCategory;
    this.iscategoryselected = true;
    this.isLoading = true;

    // Reset pagination
    this.currentToolsOffset = 0;
    this.hasMoreTools = false;
    this.displayedTypeTools = [];

    const payload = { newCategory };

    this.http.post(this.APIURL + 'get_product_details_basedon_categoryname', payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response.message === "yes" && response.products?.length > 0) {
          this.toolsArray = response.products.map((prod: any) => ({
            productimage: prod.productimage
              ? `data:image/jpeg;base64,${prod.productimage}`
              : '../../../assets/images/12.png',
            productname: prod.productname,
            productid: prod.productid,
            productdescription: prod.productdescription,
            productfundingstage: prod.productfundingstage,
            productlicense: prod.productlicense,
            rating: prod.rating,
            productwebsite: prod.productwebsite,
            producttechnology: prod.producttechnology,
            productfacebook: prod.productfacebook,
            productlinkedin: prod.productlinkedin,
            productcategory: prod.productcategory,
            productdocumentation: prod.productdocumentation,
            productusecase: prod.useCases || [],
            repositories: prod.repositories || [],
            showDropdown: false
          }));

          // Apply filtering by category
          this.filteredTools = this.toolsArray.filter(
            tool => tool.productcategory.toLowerCase() === newCategory.toLowerCase()
          );

          this.selectedTypeTools = [...this.filteredTools];
          
          // Load first 12 items
          this.loadInitialTools();
          this.noData = false;

        } else {
          this.toolsArray = [];
          this.filteredTools = [];
          this.selectedTypeTools = [];
          this.displayedTypeTools = [];
          this.noData = true;
        }
      },
      error: (error) => {
        console.error('❌ Error fetching product details:', error);
        this.isLoading = false;
        this.toolsArray = [];
        this.filteredTools = [];
        this.selectedTypeTools = [];
        this.displayedTypeTools = [];
        this.noData = true;
      }
    });
  }

  loadInitialTools(): void {
    const initialTools = this.getFilteredTools().slice(0, this.toolsLimit);
    this.displayedTypeTools = initialTools;
    this.currentToolsOffset = initialTools.length;
    this.hasMoreTools = this.currentToolsOffset < this.getFilteredTools().length;
  }

  loadMoreTools(): void {
    if (this.hasMoreTools && !this.isLoadingMoreTools) {
      this.isLoadingMoreTools = true;

      // Simulate loading delay (optional - remove if not needed)
      setTimeout(() => {
        const filteredTools = this.getFilteredTools();
        const nextTools = filteredTools.slice(
          this.currentToolsOffset, 
          this.currentToolsOffset + this.loadMoreLimit
        );
        
        this.displayedTypeTools = [...this.displayedTypeTools, ...nextTools];
        this.currentToolsOffset += nextTools.length;
        this.hasMoreTools = this.currentToolsOffset < filteredTools.length;
        this.isLoadingMoreTools = false;
      }, 300);
    }
  }

  private getFilteredTools(): Tool[] {
    if (!this.filterTerm) {
      return this.selectedTypeTools;
    }
    
    const term = this.filterTerm.toLowerCase();
    return this.selectedTypeTools.filter(tool =>
      tool.productname.toLowerCase().includes(term)
    );
  }

  onFilterChange(): void {
    // Reset pagination when filter changes
    this.currentToolsOffset = 0;
    this.displayedTypeTools = [];
    
    // Load first batch with filter applied
    this.loadInitialTools();
  }

 toggleSelect(tool: Tool) {
  const index = this.selectedTools.findIndex(t => t.productname === tool.productname);

  if (index > -1) {
    this.selectedTools.splice(index, 1);
  } else {
    if (this.selectedTools.length < 3) {
      this.selectedTools.push(tool);
    }
  }

  this.selectedTools.forEach((t, i) => t.selected = i + 1);

  this.displayedTypeTools.forEach(t => {
    if (!this.selectedTools.includes(t)) {
      t.selected = undefined;
    }
  });

  this.updateDisplayedSelectedTools();
  
  // ADD THIS LINE - Fetch review counts after selection changes
  this.getReviewCountsForSelected();
}


// Add this method to your component
async getReviewCountsForSelected(): Promise<void> {
  if (this.selectedTools.length === 0) return;

  const productIds = this.selectedTools.map(tool => tool.productid);
  const payload = { product_ids: productIds };

  this.http.post<any>(this.APIURL + 'product_comparison_review_count', payload).subscribe({
    next: (response) => {
      if (response.message === "success" && response.review_counts) {
        // Update review counts for selected tools
        response.review_counts.forEach((item: any) => {
          const tool = this.selectedTools.find(t => t.productid === item.productid);
          if (tool) {
            tool.reviewCount = item.count;
          }
        });
      }
    },
    error: (error) => {
      console.error('❌ Error fetching review counts:', error);
      // Set default count to 0 if error
      this.selectedTools.forEach(tool => {
        if (tool.reviewCount === undefined) {
          tool.reviewCount = 0;
        }
      });
    }
  });
}



  resetSelections() {
    this.selectedTools = [];
    this.displayedSelectedTools = [];
    this.selectedTypeTools.forEach(t => t.selected = undefined);
    this.filterTerm = '';
    this.selectedFilterTerm = '';
    
    // Reset pagination
    this.currentToolsOffset = 0;
    this.loadInitialTools();
  }

  onSelectedFilterChange() {
    const term = this.selectedFilterTerm.toLowerCase();
    this.displayedSelectedTools = this.selectedTools.filter(tool =>
      tool.productname.toLowerCase().includes(term)
    );
  }

  private updateDisplayedSelectedTools() {
    this.displayedSelectedTools = [...this.selectedTools];
    this.onSelectedFilterChange();
  }

  closePopup() {
    this.popupSelected = [];
    this.reviews = [];
    this.totalReviews = 0;
    this.currentOffset = 0;
  }

  // Image preview modal methods
  navigatetoProductScreen(productid: string) {
    this.router.navigate(['/home/product-item'], { queryParams: { productid } });
   
  }

  closeImagePreview() {
    this.imagePreviewModal = false;
    this.previewImageSrc = '';
    this.previewImageAlt = '';
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-bar-wrapper')) {
      // this.filteredTools = [];
    }
  }
 
}