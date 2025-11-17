import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SmallerProductCardComponent } from '../../widgets/smaller-product-card/smaller-product-card.component';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
interface Tool {
  productimage: string;
  productname: string;
  productid: string;
  productcategory: string;
  productusecase: string[];
  showDropdown?: boolean; // optional property for dropdown toggle
}
@Component({
  selector: 'app-category',
  standalone: true,
  imports: [SmallerProductCardComponent,CommonModule,RouterModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent {
  newCategory: string | null = null;
  APIURL = environment.APIURL;
  toolsArray: Tool[] = [];
  noData: boolean = false;



  constructor(private route: ActivatedRoute,private http:HttpClient,) {}

  ngOnInit(): void {
    // Subscribe to route param changes
    this.route.paramMap.subscribe(params => {
       this.newCategory = params.get('categoryName')!;
      const category = params.get('type');
      
      if (category == 'category') {
        this.getProductBasedoncategory(this.newCategory!);
      } else if(category == 'usecase'){
        this.getProductBasedonUsecase(this.newCategory!)
        
      }
      else if(category == 'technology'){
        this.getProductBasedonTechnology(this.newCategory!)
        
      }

    });
  }



  async getProductBasedonTechnology(newCategory: string): Promise<void> {
  const payload = { newCategory };
  this.http.post(this.APIURL + 'get_product_details_basedon_technology', payload).subscribe({
    next: (response: any) => {
      if (response.message === "yes") {
        this.toolsArray = response.products.map((prod: any) => ({
          productimage: prod.productimage 
            ? `data:image/jpeg;base64,${prod.productimage}`
            : '../../../assets/images/12.png',
          productname: prod.productname,
          productid: prod.productid,
          userid: prod.userid,
          productcategory: prod.productcategory,
          productusecase: prod.useCases || [],
          showDropdown: false
        }));
        this.noData = false;   // hide "no data" message
      } else {
        this.toolsArray = [];
        this.noData = true;   // show "no data" message

      }
    },
    error: (error) => {
      console.error('❌ Error fetching product details:', error);
      this.toolsArray = [];
      this.noData = true;
    }
  });
}





async getProductBasedonUsecase(newCategory: string): Promise<void> {
  const payload = { newCategory };
  this.http.post(this.APIURL + 'get_product_details_basedon_usecase', payload).subscribe({
    next: (response: any) => {
      if (response.message === "yes") {
        this.toolsArray = response.products.map((prod: any) => ({
          productimage: prod.productimage 
            ? `data:image/jpeg;base64,${prod.productimage}`
            : '../../../assets/images/12.png',
          productname: prod.productname,
          productid: prod.productid,
          userid: prod.userid,
          productcategory: prod.productcategory,
          productusecase: prod.useCases || [],
          showDropdown: false
        }));
        this.noData = false;   // hide "no data" message
      } else {
        this.toolsArray = [];
        this.noData = true;   // show "no data" message

      }
    },
    error: (error) => {
      console.error('❌ Error fetching product details:', error);
      this.toolsArray = [];
      this.noData = true;
    }
  });
}

  
  





async getProductBasedoncategory(newCategory: string): Promise<void> {
  const payload = { newCategory };
  this.http.post(this.APIURL + 'get_product_details_basedon_categoryname', payload).subscribe({
    next: (response: any) => {
      if (response.message === "yes") {
        this.toolsArray = response.products.map((prod: any) => ({
          productimage: prod.productimage 
            ? `data:image/jpeg;base64,${prod.productimage}`
            : '../../../assets/images/12.png',
          productname: prod.productname,
          userid: prod.userid,
          productid: prod.productid,
          productcategory: prod.productcategory,
          productusecase: prod.useCases || [],
          showDropdown: false
        }));
        this.noData = false;   // hide "no data" message
      } else {
        this.toolsArray = [];
        this.noData = true;   // show "no data" message

      }
    },
    error: (error) => {
      console.error('❌ Error fetching product details:', error);
      this.toolsArray = [];
      this.noData = true;
    }
  });
}









}
