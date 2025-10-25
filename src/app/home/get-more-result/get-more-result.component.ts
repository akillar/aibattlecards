import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SmallerProductCardComponent } from '../../widgets/smaller-product-card/smaller-product-card.component';
import { LoadingComponent } from '../../widgets/loading/loading.component';
import { GetMoreScreenFeaturedProductStateService } from '../../services/get-more-screen-featured-product-state.service';
import { GetMoreScreenNewProductStateService } from '../../services/get-more-screen-new-product-state.service';
import { GetMoreScreenMostViewedProductStateService } from '../../services/get-more-screen-most-viewed-product-state.service';

@Component({
  selector: 'app-get-more-result',
  standalone: true,
  imports: [SmallerProductCardComponent, CommonModule, RouterModule, LoadingComponent],
  templateUrl: './get-more-result.component.html',
  styleUrl: './get-more-result.component.css'
})
export class GetMoreResultComponent implements OnInit {

  APIURL = environment.APIURL;

  featuredArrayDetails: any[] = [];
  NewArrayDetails: any[] = [];
  MostViewedArrayDetails: any[] = [];

  lookingfortext: string = '';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  hasMoreData: boolean = true;
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private featuredState: GetMoreScreenFeaturedProductStateService,
    private newState: GetMoreScreenNewProductStateService,
    private mostViewedState: GetMoreScreenMostViewedProductStateService
  ) {}

  onProductDeleted(productId: string) {
    if (this.lookingfortext === 'featured') {
      this.featuredArrayDetails = this.featuredArrayDetails.filter(p => p.productid !== productId);
      this.featuredState.saveState(this.featuredArrayDetails);
    } else if (this.lookingfortext === 'new') {
      this.NewArrayDetails = this.NewArrayDetails.filter(p => p.productid !== productId);
      this.newState.saveState(this.NewArrayDetails);
    } else if (this.lookingfortext === 'mostviewed') {
      this.MostViewedArrayDetails = this.MostViewedArrayDetails.filter(p => p.productid !== productId);
      this.mostViewedState.saveState(this.MostViewedArrayDetails);
    }
  }

  ngOnInit() {


    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.route.params.subscribe(params => {
      this.lookingfortext = params['lookingtext'];

      this.currentPage = 1;
      this.hasMoreData = true;
      this.clearCurrentData();

      // Load from cache first
      if (this.lookingfortext === 'featured') {
        const cached = this.featuredState.getState();
        if (cached?.length) {
          this.featuredArrayDetails = cached;
          return;
        }
      } else if (this.lookingfortext === 'new') {
        const cached = this.newState.getState();
        if (cached?.length) {
          this.NewArrayDetails = cached;
          return;
        }
      } else if (this.lookingfortext === 'mostviewed') {
        const cached = this.mostViewedState.getState();
        if (cached?.length) {
          this.MostViewedArrayDetails = cached;
          return;
        }
      }

      this.loadInitialData();
    });
  }

  clearCurrentData() {
    this.featuredArrayDetails = [];
    this.NewArrayDetails = [];
    this.MostViewedArrayDetails = [];
  }

  loadInitialData() {
    if (this.lookingfortext === 'featured') {
      this.getAllProductDetailsFeaturedProducts();
    } else if (this.lookingfortext === 'new') {
      this.getAllProductDetailsNewProducts();
    } else if (this.lookingfortext === 'mostviewed') {
      this.getAllProductDetailsMostViewedProducts();
    }
  }

  onLoadMore() {
    if (this.hasMoreData && !this.isLoading) {
      this.currentPage++;
      this.loadInitialData();
    }
  }

  // ✅ Utility method to merge arrays without duplicates by productid
  private mergeUnique(existing: any[], incoming: any[]): any[] {
    const combined = [...existing, ...incoming];
    const seen = new Set();
    return combined.filter(item => {
      if (seen.has(item.productid)) return false;
      seen.add(item.productid);
      return true;
    });
  }

  async getAllProductDetailsFeaturedProducts(): Promise<void> {
    this.isLoading = true;
    const requestBody = { page: this.currentPage, limit: this.pageSize };

    this.http.post(this.APIURL + 'get_all_product_details_all_featured', requestBody).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.message === "yes" && response.products?.length) {
          const newProducts = this.mapProducts(response.products);
          this.featuredArrayDetails = this.mergeUnique(this.featuredArrayDetails, newProducts);
          this.featuredState.saveState(this.featuredArrayDetails);
          this.hasMoreData = response.products.length === this.pageSize;
        } else {
          this.hasMoreData = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasMoreData = false;
        console.error('❌ Error fetching featured products:', error);
      }
    });
  }

  async getAllProductDetailsNewProducts(): Promise<void> {
    this.isLoading = true;
    const requestBody = { page: this.currentPage, limit: this.pageSize };

    this.http.post(this.APIURL + 'get_all_product_details_all_new', requestBody).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.message === "yes" && response.products?.length) {
          const newProducts = this.mapProducts(response.products);
          this.NewArrayDetails = this.mergeUnique(this.NewArrayDetails, newProducts);
          this.newState.saveState(this.NewArrayDetails);
          this.hasMoreData = response.products.length === this.pageSize;
        } else {
          this.hasMoreData = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasMoreData = false;
        console.error('❌ Error fetching new products:', error);
      }
    });
  }

  async getAllProductDetailsMostViewedProducts(): Promise<void> {
    this.isLoading = true;
    const requestBody = { page: this.currentPage, limit: this.pageSize };

    this.http.post(this.APIURL + 'get_all_product_details_all_most_viewed', requestBody).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.message === "yes" && response.products?.length) {
          const newProducts = this.mapProducts(response.products);
          this.MostViewedArrayDetails = this.mergeUnique(this.MostViewedArrayDetails, newProducts);
          this.mostViewedState.saveState(this.MostViewedArrayDetails);
          this.hasMoreData = response.products.length === this.pageSize;
        } else {
          this.hasMoreData = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasMoreData = false;
      }
    });
  }

  private mapProducts(products: any[]): any[] {
    return products.map((prod: any) => ({
      productname: prod.productname,
      productcategory: prod.productcategory,
      productimage: prod.productimage
        ? `data:image/jpeg;base64,${prod.productimage}`
        : '../../../assets/images/12.png',
      productusecase: prod.usecasenames && prod.usecasenames.length ? prod.usecasenames : [],
      productid: prod.productid,
      productusecaseid: prod.productusecaseid,
      showDropdown: false
    }));
  }
}
