import { Component, OnInit } from '@angular/core';
import { ProductCardHolderComponent } from '../../widgets/product-card-holder/product-card-holder.component';
import { CommonProductListComponent } from '../../widgets/common-product-list/common-product-list.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NewProductStateService } from '../../services/newproduct.service';
import { MostViewedProductStateService } from '../../services/most-viewed-product-state.service';
import { CommonModule } from '@angular/common';
import { PostSliderShimmerComponent } from '../../shimmer/post-slider-shimmer/post-slider-shimmer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ProductCardHolderComponent,
    CommonProductListComponent,
    PostSliderShimmerComponent,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  featuredArrayDetails = [
    { name: "Product name", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Mithila dilshan wickramaarachchi", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
    { name: "Another product", type: "Agent", icon: "../../../assets/images/12.png", tags: ["sells", "Productivity"] },
  ];

  currentPage: number = 1;
  pageSize: number = 10;
  NewArrayDetails: any[] = [];
  MostViewedArrayDetails: any[] = [];

  // Loading states
  isLoadingFeatured: boolean = true;
  isLoadingNew: boolean = true;
  isLoadingMostViewed: boolean = true;

  APIURL = environment.APIURL;

  constructor(
    private http: HttpClient,
    private router: Router,
    private newProductState: NewProductStateService,
    private mostViewedState: MostViewedProductStateService
  ) { }

  ngOnInit(): void {
    // Check if cache exists first
    const cachedNew = this.newProductState.getState();
    const cachedMostViewed = this.mostViewedState.getState();

    // Featured products - simulating loading since you have static data
    // Remove this timeout when you implement real API call for featured
    setTimeout(() => {
      this.isLoadingFeatured = false;
    }, 1000);

    if (cachedNew) {
      this.NewArrayDetails = cachedNew;
      this.isLoadingNew = false;
    } else {
      this.getAllProductDetailsNewProducts();
    }

    if (cachedMostViewed) {
      this.MostViewedArrayDetails = cachedMostViewed;
      this.isLoadingMostViewed = false;
    } else {
      this.getAllProductDetailsMostViewedProducts();
    }
  }

  getmoreresult(getmoretext: string) {
    this.router.navigate(['/home/get-more-result/' + getmoretext]);
  }

  async getAllProductDetailsMostViewedProducts(): Promise<void> {
    this.isLoadingMostViewed = true;
    const requestBody = {
      page: this.currentPage,
      limit: this.pageSize
    };

    this.http.post(this.APIURL + 'get_all_product_details_all_most_viewed', requestBody).subscribe({
      next: (response: any) => {
        if (response.message === "yes" && response.products?.length) {
          const newProducts = response.products.map((prod: any) => ({
            name: prod.productname,
            type: prod.productcategory,
            icon: prod.productimage
              ? `data:image/jpeg;base64,${prod.productimage}`
              : '../../../assets/images/12.png',
            tags: prod.usecasenames && prod.usecasenames.length ? prod.usecasenames : [],
            productid: prod.productid,
            productusecaseid: prod.productusecaseid,
            showDropdown: false
          }));

          this.MostViewedArrayDetails = [...this.MostViewedArrayDetails, ...newProducts];
          this.mostViewedState.saveState(this.MostViewedArrayDetails);
        } else {
          console.warn("⚠️ No product found");
        }
        this.isLoadingMostViewed = false;
      },
      error: (error) => {
        console.error('❌ Error fetching product details:', error);
        this.isLoadingMostViewed = false;
      }
    });
  }

  async getAllProductDetailsNewProducts(): Promise<void> {
    this.isLoadingNew = true;
    const requestBody = {
      page: this.currentPage,
      limit: this.pageSize
    };

    this.http.post(this.APIURL + 'get_all_product_details_all_new', requestBody).subscribe({
      next: (response: any) => {
        if (response.message === "yes" && response.products?.length) {
          const newProducts = response.products.map((prod: any) => ({
            name: prod.productname,
            type: prod.productcategory,
            icon: prod.productimage
              ? `data:image/jpeg;base64,${prod.productimage}`
              : '../../../assets/images/12.png',
            tags: prod.usecasenames && prod.usecasenames.length ? prod.usecasenames : [],
            productid: prod.productid,
            productusecaseid: prod.productusecaseid,
            showDropdown: false
          }));

          this.NewArrayDetails = [...this.NewArrayDetails, ...newProducts];
          this.newProductState.saveState(this.NewArrayDetails);
        } else {
          console.warn("⚠️ No product found");
        }
        this.isLoadingNew = false;
      },
      error: (error) => {
        console.error('❌ Error fetching product details:', error);
        this.isLoadingNew = false;
      }
    });
  }
}