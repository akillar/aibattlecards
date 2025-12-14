import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SmallerProductCardComponent } from '../../widgets/smaller-product-card/smaller-product-card.component';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/getuserid.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

interface Tool {
  productimage: string;
  productname: string;
  userid: string;
  productid: string;
  productcategory: string;
  productusecase: string[];
  showDropdown?: boolean;
}

interface Review {
  profileImg: string;
  username: string;
  date: Date;
  comment: string;
  showDropdown?: boolean;
  createddate: string;
  productid: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, SmallerProductCardComponent, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  @ViewChildren('formField') formFields!: QueryList<ElementRef>;
  
  activeTab: string = 'Profile';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  productAddingForm!: FormGroup;
  reposAddingForm!: FormGroup;
  showDeleteConfirm: boolean = false;
  showReviewDeleteConfirm: boolean = false;
  isaddingnewproduct: boolean = false;
  selectedProductImage: string | null = null;
  showOldPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  APIURL = environment.APIURL;
  idforauthafteruserloggedin = environment.idforauthafteruserloggedin;
  selectedProductFile: File | null = null;
  userInitials: string = "";
  isEditMode: boolean = false;
  isFeaturedGlobal: number = 0; 

  toolsArray: Tool[] = [];
  reviewsArray: Review[] = [];

  categories: any[] = [];
  usecases: any[] = [];
  technologies: any[] = [];

  filteredUseCases: string[] = [];
  selectedUseCases: string[] = [];
  useCaseInput: string = '';
  
  // ✅ Technology Multi-Select Properties
  selectedTechnologies: string[] = [];
  technologyInput: string = '';
  filteredTechnologies: string[] = [];
  showTechnologyDropdown: boolean = false;
  
  selectedImage: string | ArrayBuffer | null = null;
  userid: string = '';
  curruntpassword: string = '';
  message: string = '';
  messageClass: string = '';
  curruntemailaddress: string = '';
  deleteConfirmText: string = '';
  updatingproductid: string = '';
  messageVisible: boolean = false;
  submitButtonText: string = 'Submit Product';

  userReviewsOffset: number = 0;
  userReviewsLimit: number = 5;
  hasMoreUserReviews: boolean = false;
  isLoadingUserReviews: boolean = false;
  selectedReview: any;
  userProductsCurrentPage: number = 1;
  userProductsPageSize: number = 10;
  hasMoreUserProducts: boolean = true;
  isLoadingUserProducts: boolean = false;
  private productNameCheck$ = new Subject<string>();

  productNameExists: boolean = false;
  productNameMessage: string = '';
  productNameMessageClass: string = '';
  isCheckingProductName: boolean = false;
  existingProduct: any = null;
  originalProductName: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadUsecases();
    this.loadTechnologies();

    // ✅ Updated Form - Removed technology FormControl
    this.productAddingForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      license: ['', Validators.required],
      // technology: ['', Validators.required], // ❌ REMOVED - Now using array
      website: ['', Validators.required],
      fundingStage: ['', Validators.required],
      productdescription: ['', Validators.required],

      founders: this.fb.array([this.fb.control('', Validators.required)]),
      baseModels: this.fb.array([this.fb.control('', Validators.required)]),
      useCases: this.fb.array([]),
      deployments: this.fb.array([this.fb.control('', Validators.required)]),
      mediaPreviews: this.fb.array([this.fb.control(null)]),
      repositories: this.fb.array([this.fb.control('')]), 

      productfb: [''],
      documentationlink: [''],
      productlinkedin: [''],
      xlink: [''],
    });
 
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      linkedin: ['', Validators.required],
      facebook: ['', Validators.required],
      designation: ['', Validators.required],
      about: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.setupProductNameChecker();

    this.route.queryParams.subscribe((params: any) => {
      const tab = params['tab'];
      const action = params['action'];
      const productId = params['productid'];

      if (tab) this.activeTab = tab;

      if (tab === 'Your Tools' && action === 'add_product') {
        this.isaddingnewproduct = true;
        
        if (productId) {
          this.isEditMode = true;
          this.getProductDetailsToUpdate(productId);
          this.submitButtonText = 'Update Product';
          this.updatingproductid = productId;
        }
      } else {
        this.isEditMode = false;
        this.resetProductForm();
        this.submitButtonText = 'Submit Product';
        this.isaddingnewproduct = false;
      }
    });

    this.userid = this.authService.getUserid()!;
    if (this.userid) { 
      this.getProductDetails(this.userid);
      this.getUserDetails(this.userid);
      this.getUserReviews(this.userid);
    }
  }

  onTechnologyInput(event: any): void {
  const value = event.target.value.toLowerCase();
  this.technologyInput = event.target.value;

  if (value) {
    this.filteredTechnologies = this.technologies
      .filter(t =>
        t.technologyName.toLowerCase().includes(value) &&
        !this.selectedTechnologies.includes(t.technologyName)
      )
      .map(t => t.technologyName);
  } else {
    // ✅ Show all available technologies when input is empty
    this.filteredTechnologies = this.technologies
      .filter(t => !this.selectedTechnologies.includes(t.technologyName))
      .map(t => t.technologyName);
  }
  
  this.showTechnologyDropdown = this.filteredTechnologies.length > 0;
}


onTechnologyInputFocus(): void {
  // Show all available technologies when focused (excluding already selected ones)
  this.filteredTechnologies = this.technologies
    .filter(t => !this.selectedTechnologies.includes(t.technologyName))
    .map(t => t.technologyName);
  
  this.showTechnologyDropdown = this.filteredTechnologies.length > 0;
}


selectTechnology(technology: string): void {
  if (!this.selectedTechnologies.includes(technology)) {
    this.selectedTechnologies.push(technology);
    this.technologyInput = '';
    
    // ✅ Update filtered list to exclude newly selected technology
    this.filteredTechnologies = this.technologies
      .filter(t => !this.selectedTechnologies.includes(t.technologyName))
      .map(t => t.technologyName);
    
    // ✅ Keep dropdown open if there are more technologies
    this.showTechnologyDropdown = this.filteredTechnologies.length > 0;
    
    // ✅ Re-focus input after selection
    setTimeout(() => {
      const input = document.querySelector('.technology-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
  }
}
  // ✅ Remove Selected Technology
  removeTechnology(technology: string): void {
    this.selectedTechnologies = this.selectedTechnologies.filter(t => t !== technology);
  }

  setupProductNameChecker(): void {
    this.productNameCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(productName => {
        if (!productName || productName.trim().length === 0) {
          this.productNameExists = false;
          this.productNameMessage = '';
          this.productNameMessageClass = '';
          this.existingProduct = null;
          return [];
        }

        if (this.isEditMode && productName.trim().toLowerCase() === this.originalProductName.toLowerCase()) {
          this.productNameExists = false;
          this.productNameMessage = '';
          this.productNameMessageClass = '';
          this.existingProduct = null;
          return [];
        }

        this.isCheckingProductName = true;
        return this.checkProductName(productName);
      })
    ).subscribe({
      next: (result: any) => {
        this.isCheckingProductName = false;

        if (result && result.exists !== undefined) {
          this.productNameExists = result.exists;
          this.productNameMessage = result.message;
          this.existingProduct = result.product;

          if (result.exists) {
            this.productNameMessageClass = 'error-message';
          } else if (result.message) {
            this.productNameMessageClass = 'success-message';
          } else {
            this.productNameMessageClass = '';
          }
        }
      },
      error: (error) => {
        console.error('Error checking product name:', error);
        this.isCheckingProductName = false;
        this.productNameExists = false;
        this.productNameMessage = 'Error checking product name';
        this.productNameMessageClass = 'error-message';
      }
    });
  }

  openProductInNewTab(event: Event, productId: string): void {
    event.preventDefault();
    const url = `/home/product-item?productid=${productId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async checkProductName(productname: string): Promise<any> {
    const payload = { productname: productname };
    return this.http.post(this.APIURL + 'check_product_name', payload).toPromise();
  }

  onProductNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const productName = input.value;
    this.productNameCheck$.next(productName);
  }

  async onDeleteAccount(): Promise<void> {
    if (this.deleteConfirmText === 'delete-account') {
      this.showMessage("Deleting your account...", "error");
      
      const payload = { userid: this.userid };
      
      this.http.post(this.APIURL + 'delete_account', payload).subscribe({
        next: (response: any) => {
          if (response.message === "Account deleted successfully") {
            this.showMessage("Account deleted successfully!", "success");
            this.showDeleteConfirm = false;
            this.deleteConfirmText = '';
            
            localStorage.clear();
            sessionStorage.clear();
            
            setTimeout(() => {
              this.router.navigate(['/auth/log-in']);
            }, 2000);
          } else {
            this.showMessage("Failed to delete account. Please try again.", "error");
          }
        },
        error: (error) => {
          console.error('❌ Error deleting account:', error);
          this.showMessage("An error occurred while deleting your account. Please try again.", "error");
        }
      });
    }
  }

  async loadTechnologies(): Promise<void> {
    this.http.get(this.APIURL + `get_technologies`).subscribe({
      next: (response: any) => {
        if (response.message === "Technologies retrieved successfully") {
          this.technologies = response.technologies.map((t: any) => ({
            id: t.id,
            techknologyid: t.techknologyid,
            technologyName: t.technologyName,
            createdDate: new Date(t.createdDate)
          }));
        } else {
          console.log('No technologies found');
          this.technologies = [];
        }
      },
      error: (error) => {
        console.error('Error loading technologies:', error);
        alert("Failed to load technologies. Please try again.");
        this.technologies = [];
      }
    });
  }

  async loadUsecases(): Promise<void> {
    this.http.get(this.APIURL + 'get_usecases').subscribe({
      next: (response: any) => {
        if (response.message === "Use cases retrieved successfully") {
          this.usecases = response.usecases.map((u: any) => ({
            id: u.id,
            usecaseid: u.usecaseadminid,
            usecaseName: u.usecaseName
          }));
        }
      },
      error: (err) => {
        console.error("Error loading use cases:", err);
      }
    });
  }

  async loadCategories(): Promise<void> {
    this.http.get(this.APIURL + 'get_categories').subscribe({
      next: (response: any) => {
        if (response.message === "Categories retrieved successfully") {
          this.categories = response.categories.map((c: any) => ({
            id: c.id,
            categoryid: c.categoryid,
            categoryName: c.categoryName
          }));
        }
      },
      error: (err) => {
        console.error("Error loading categories:", err);
      }
    });
  }

  disablePaste(event: ClipboardEvent) {
    event.preventDefault();
  }

  disableCopy(event: ClipboardEvent) {
    event.preventDefault();
  }

  async getUserReviews(userid: string, offset: number = 0, reset: boolean = false): Promise<void> {
    if (reset) {
      this.isLoadingUserReviews = true;
    }

    const payload = {
      userid,
      offset,
      limit: this.userReviewsLimit
    };

    this.http.post<any>(this.APIURL + 'get_user_reviews_page', payload).subscribe({
      next: (response) => {
        if (response.message === "found") {
          if (reset) {
            this.reviewsArray = response.reviews || [];
            this.userReviewsOffset = response.limit || this.userReviewsLimit;
          } else {
            this.reviewsArray = [...this.reviewsArray, ...(response.reviews || [])];
            this.userReviewsOffset += (response.reviews || []).length;
          }
          this.hasMoreUserReviews = response.has_more || false;
        } else {
          if (reset) {
            this.reviewsArray = [];
            this.hasMoreUserReviews = false;
            this.userReviewsOffset = 0;
          }
        }

        this.isLoadingUserReviews = false;
      },
      error: (error) => {
        console.error('❌ Error fetching user reviews:', error);
        if (reset) {
          this.reviewsArray = [];
          this.hasMoreUserReviews = false;
          this.userReviewsOffset = 0;
        }
        this.isLoadingUserReviews = false;
      }
    });
  }

  onLoadMoreUserReviews(): void {
    if (this.hasMoreUserReviews) {
      this.getUserReviews(this.userid, this.userReviewsOffset, false);
    }
  }

  private resetProductForm(): void {
    this.productAddingForm.reset();
    
    this.resetFormArray('founders');
    this.resetFormArray('baseModels');
    this.resetFormArray('deployments');
    this.resetFormArray('mediaPreviews');
    this.resetFormArray('repositories');
    
    this.selectedUseCases = [];
    this.selectedTechnologies = []; // ✅ Reset technologies
    this.useCaseInput = '';
    this.technologyInput = ''; // ✅ Reset technology input
    this.filteredUseCases = [];
    this.filteredTechnologies = []; // ✅ Reset filtered technologies
    
    this.selectedImage = null;
    this.selectedProductFile = null;
    this.selectedProductImage = null;
    this.originalProductName = '';
    
    this.productAddingForm.markAsUntouched();
    this.productAddingForm.markAsPristine();
  }

  private resetFormArray(arrayName: string): void {
    const formArray = this.productAddingForm.get(arrayName) as FormArray;
    
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
    
    if (arrayName === 'mediaPreviews') {
      formArray.push(this.fb.control(null));
    } else {
      formArray.push(this.fb.control('', Validators.required));
    }
  }

  async getProductDetailsToUpdate(productId: string): Promise<void> {
    const payload = { productid: productId };

    this.http.post(this.APIURL + 'get_product_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'yes' && response.product) {
          this.populateProductForm(response);
        }
      },
      error: err => console.error('Error fetching product details for update:', err)
    });
  }

  private populateProductForm(response: any): void {
    const prod = response.product;
    this.isFeaturedGlobal = prod.isFeatured || 0;
    this.originalProductName = prod.productname || '';

    // ✅ Parse technologies from comma-separated string
    const technologiesString = prod.producttechnology || '';
    this.selectedTechnologies = technologiesString
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    console.log('✅ Loaded technologies:', this.selectedTechnologies);

    // Patch basic form fields (excluding technology)
    this.productAddingForm.patchValue({
      name: prod.productname || '',
      type: prod.productcategory || '',
      license: prod.productlicense || '',
      // technology: '', // ❌ Don't patch this
      website: prod.productwebsite || '',
      fundingStage: prod.productfundingstage || '',
      productdescription: prod.productdescription || '',
      productfb: prod.productfacebook || '',
      documentationlink: prod.productdocumentation || '',
      xlink: prod.xlink || '',
      productlinkedin: prod.productlinkedin || ''
    });

    if (prod.productimage) {
      this.selectedImage = `data:image/png;base64,${prod.productimage}`;
    }

    this.populateFormArray('founders', response.founders || []);
    this.populateFormArray('baseModels', response.baseModels || []);
    this.populateFormArray('deployments', response.deployments || []);
    this.populateFormArray('mediaPreviews', response.mediaPreviews || []);
    this.populateFormArray('repositories', response.repositories || []);

    if (response.useCases && response.useCases.length > 0) {
      this.selectedUseCases = [...response.useCases];
    }
  }

  private populateFormArray(arrayName: string, dataArray: string[]): void {
    const formArray = this.productAddingForm.get(arrayName) as FormArray;
    
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }

    if (dataArray && dataArray.length > 0) {
      dataArray.forEach(item => {
        formArray.push(this.fb.control(item, Validators.required));
      });
    } else {
      formArray.push(this.fb.control('', Validators.required));
    }
  }

  get founders(): FormArray {
    return this.productAddingForm.get('founders') as FormArray;
  }

  get baseModels(): FormArray {
    return this.productAddingForm.get('baseModels') as FormArray;
  }

  get deployments(): FormArray {
    return this.productAddingForm.get('deployments') as FormArray;
  }

  get mediaPreviews(): FormArray {
    return this.productAddingForm.get('mediaPreviews') as FormArray;
  }

  get repositories(): FormArray {
    return this.productAddingForm.get('repositories') as FormArray;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;

    const queryParams: any = { tab };

    if (tab === 'Your Tools' && this.isaddingnewproduct) {
      queryParams.action = 'add_product';
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  onAddProduct(): void {
    this.isaddingnewproduct = true;

    const queryParams = { ...this.route.snapshot.queryParams };
    delete queryParams['productid'];
    queryParams['action'] = 'add_product';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: '',
    });
  }

  closeAddProduct(): void {
    this.isaddingnewproduct = false;

    const queryParams = { ...this.route.snapshot.queryParams };
    delete queryParams['action'];
    delete queryParams['productid'];

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: '',
    });
  }

  onProductDeleted(productId: string): void {
    this.getProductDetails(this.userid);
  }

  async getUserDetails(userid: string): Promise<void> {
    const payload = { userid };

    this.http.post(this.APIURL + 'get_user_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'yes') {
          const user = response.user;

          this.profileForm.patchValue({
            name: user.username || '',
            email: user.email || '',
            linkedin: user.linkedin || '',
            facebook: user.facebook || '',
            designation: user.designation || '',
            about: user.about || ''
          });
          this.userInitials = this.generateInitials(user.username || '');
          this.curruntpassword = user.password;
          this.curruntemailaddress = user.email;
        } else {
          console.warn("No user found");
        }
      },
      error: (error) => {
        console.error('❌ Error fetching user details:', error);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onPasswordSubmit() {
    if (this.passwordForm.invalid) return;

    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (oldPassword !== this.curruntpassword) {
      this.showMessage("Old password is incorrect!", "error");
      return;
    }

    if (newPassword === oldPassword) {
      this.showMessage("New password must be different from old password!", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage("New password and confirm password do not match!", "error");
      return;
    }

    this.passwordForm.reset();
    this.showMessage("Password updated successfully!", "success");
    this.router.navigate(['/auth/reset', this.idforauthafteruserloggedin]);
    sessionStorage.setItem('emailforauthafteruserloggedin', this.curruntemailaddress);
    sessionStorage.setItem('confirmPassword', confirmPassword);
  }

  private generateInitials(name: string): string {
    if (!name) return "";
    const words = name.trim().split(" ");
    const initials = words
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || "")
      .join("");
    return initials;
  }

  onSubmitProduct(): void {
    if (this.productAddingForm.valid) {
      const formData = this.productAddingForm.value;
      formData.useCases = this.selectedUseCases;
      
      if (this.isEditMode) {
        this.updateProductDetails(formData);
      } else {
        this.createProduct();
      }
    } else {
      console.log('Form is invalid');
    }
  }

  async updateProductDetails(formData: any): Promise<void> {
    // ✅ Validate that at least one technology is selected
    if (this.selectedTechnologies.length === 0) {
      this.showMessage("Please select at least one technology", "error");
      return;
    }

    const payload: any = {
      productid: this.updatingproductid,
      userid: this.userid,
      productname: formData.name,
      productcategory: formData.type,
      productlicense: formData.license,
      
      // ✅ Join technologies with comma
      producttechnology: this.selectedTechnologies.join(','),
      
      productwebsite: formData.website,
      productfundingstage: formData.fundingStage,
      productdescription: formData.productdescription,
      productfacebook: formData.productfb,
      productlinkedin: formData.productlinkedin,
      xlink: formData.xlink,
      isFeatured: this.isFeaturedGlobal,
      founders: formData.founders.filter((f: string) => f.trim() !== ''),
      baseModels: formData.baseModels.filter((b: string) => b.trim() !== ''),
      deployments: formData.deployments.filter((d: string) => d.trim() !== ''),
      mediaPreviews: formData.mediaPreviews.filter((m: string) => m && m.trim() !== ''),
      useCases: this.selectedUseCases
    };


    if (this.selectedProductFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const base64String = (reader.result as string).split(',')[1];
          payload.productimage = base64String;
          this.sendUpdateRequest(payload);
        }
      };
      reader.readAsDataURL(this.selectedProductFile);
    } else {
      this.sendUpdateRequest(payload);
    }
  }

  async sendUpdateRequest(payload: any): Promise<void> {
    this.http.post(this.APIURL + 'update_product_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'success') {
          this.showMessage('Product updated successfully!', 'success');
          this.getProductDetails(this.userid);
          setTimeout(() => {
            this.router.navigate(['/home/user-profile'], { 
              queryParams: { tab: 'Your Tools' } 
            });
          }, 1000);
        } else {
          this.showMessage('Failed to update product', 'error');
        }
      },
      error: err => {
        console.error('Error updating product:', err);
        this.showMessage('Error updating product', 'error');
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedProductFile = file;

      const reader = new FileReader();
      reader.onload = e => {
        this.selectedImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async createProduct(): Promise<void> {
    // ✅ Validate that at least one technology is selected
    if (this.selectedTechnologies.length === 0) {
      this.showMessage("Please select at least one technology", "error");
      return;
    }

    const useCasesFormArray = this.productAddingForm.get('useCases') as FormArray;
    useCasesFormArray.clear();
    this.selectedUseCases.forEach(uc => useCasesFormArray.push(this.fb.control(uc)));

    if (this.productAddingForm.valid) {
      const formData = new FormData();

      formData.append('name', this.productAddingForm.get('name')?.value);
      formData.append('type', this.productAddingForm.get('type')?.value);
      formData.append('license', this.productAddingForm.get('license')?.value);
      
      // ✅ Join technologies with comma
      formData.append('technology', this.selectedTechnologies.join(','));
      console.log('✅ Creating product with technologies:', this.selectedTechnologies.join(','));
      
      formData.append('website', this.productAddingForm.get('website')?.value);
      formData.append('fundingStage', this.productAddingForm.get('fundingStage')?.value);
      formData.append('productdescription', this.productAddingForm.get('productdescription')?.value);
      formData.append('productdocumentation', this.productAddingForm.get('productdocumentation')?.value);
      formData.append('xlink', this.productAddingForm.get('xlink')?.value);
      formData.append('userid', this.userid);

      const founders = this.productAddingForm.get('founders')?.value || [];
      founders.forEach((f: string, i: number) => formData.append(`founders[${i}]`, f));

      const useCases = this.selectedUseCases || [];
      useCases.forEach((uc: string, i: number) => formData.append(`useCases[${i}]`, uc));

      const baseModels = this.productAddingForm.get('baseModels')?.value || [];
      baseModels.forEach((b: string, i: number) => formData.append(`baseModels[${i}]`, b));

      const deployments = this.productAddingForm.get('deployments')?.value || [];
      const validDeployments = deployments.filter((d: string) => d && d.trim() !== '');
      validDeployments.forEach((d: string, i: number) => formData.append(`deployments[${i}]`, d));

      const mediaPreviews = this.productAddingForm.get('mediaPreviews')?.value || [];
      mediaPreviews.forEach((m: string, i: number) => formData.append(`mediaPreviews[${i}]`, m));

      const repositories = this.productAddingForm.get('repositories')?.value || [];
      repositories.forEach((r: string, i: number) => formData.append(`repositories[${i}]`, r));

      formData.append('documentationlink', this.productAddingForm.get('documentationlink')?.value || '');

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('productImage', fileInput.files[0]);
      }
      
      formData.append('productfb', this.productAddingForm.get('productfb')?.value || '');
      formData.append('productlinkedin', this.productAddingForm.get('productlinkedin')?.value || '');

      this.http.post(this.APIURL + 'insert_product', formData).subscribe({
        next: (response: any) => {
          if (response.message === "yes") {
            this.isaddingnewproduct = false;
            this.productAddingForm.reset();
            this.selectedUseCases = [];
            this.selectedTechnologies = []; // ✅ Reset technologies
            this.selectedProductImage = null;
            this.selectedImage = null;
            this.getProductDetails(this.userid);
            this.messageVisible = true;
            this.showMessage("✅ Product Added Successfully", "success");
          }
        },
        error: (error) => {
          console.error('❌ Error inserting product:', error);
          this.showMessage("Error adding product", "error");
        }
      });
    } else {
      this.productAddingForm.markAllAsTouched();
      console.warn('❌ Form is invalid.');
    }
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageClass = type === 'success' ? 'green-good' : 'red-bad';
    this.messageVisible = true;

    setTimeout(() => {
      this.messageVisible = false;
    }, 3000);
  }

  async getProductDetails(userid: string, reset: boolean = true): Promise<void> {
    if (this.isLoadingUserProducts) {
      return;
    }

    if (reset) {
      this.userProductsCurrentPage = 1;
      this.hasMoreUserProducts = true;
      this.toolsArray = [];
    }

    this.isLoadingUserProducts = true;

    const payload = { 
      userid,
      page: this.userProductsCurrentPage,
      limit: this.userProductsPageSize
    };

    this.http.post(this.APIURL + 'get_all_product_details', payload).subscribe({
      next: (response: any) => {
        this.isLoadingUserProducts = false;

        if (response.message === "yes" && response.products?.length) {
          const newProducts = response.products.map((prod: any) => ({
            productimage: prod.productimage 
              ? `data:image/jpeg;base64,${prod.productimage}`
              : '../../../assets/images/12.png',
            productname: prod.productname,
            userid: prod.userid,
            productid: prod.productid,
            productcategory: prod.productcategory,
            productusecase: prod.usecasenames || [],
            showDropdown: false
          }));

          this.toolsArray = [...this.toolsArray, ...newProducts];

          if (newProducts.length < this.userProductsPageSize) {
            this.hasMoreUserProducts = false;
          }

          this.userProductsCurrentPage++;

        } else {
          if (reset) {
            console.warn("No product found");
            this.toolsArray = [];
          }
          this.hasMoreUserProducts = false;
        }
      },
      error: (error) => {
        console.error('❌ Error fetching product details:', error);
        this.isLoadingUserProducts = false;
        if (reset) {
          this.toolsArray = [];
        }
      }
    });
  }

  loadMoreUserProducts(): void {
    if (!this.isLoadingUserProducts && this.hasMoreUserProducts) {
      this.getProductDetails(this.userid, false);
    }
  }

  togglePassword(field: 'old' | 'new' | 'confirm') {
    if (field === 'old') {
      this.showOldPassword = !this.showOldPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onUseCaseInput(event: any) {
    const value = event.target.value.toLowerCase();
    this.useCaseInput = event.target.value;

    if (value) {
      this.filteredUseCases = this.usecases
        .filter(u =>
          u.usecaseName.toLowerCase().includes(value) &&
          !this.selectedUseCases.includes(u.usecaseName)
        )
        .map(u => u.usecaseName);
    } else {
      this.filteredUseCases = [];
    }
  }

  selectUseCase(usecase: string) {
    if (!this.selectedUseCases.includes(usecase)) {
      this.selectedUseCases.push(usecase);
      this.useCaseInput = '';
      this.filteredUseCases = [];
    }
  }

  removeUseCase(usecase: string) {
    this.selectedUseCases = this.selectedUseCases.filter(u => u !== usecase);
  }

  onProductImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.productAddingForm.patchValue({ productImage: file });

      const reader = new FileReader();
      reader.onload = () => {
        this.selectedProductImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onMediaSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreviews.at(index).setValue(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeMedia(index: number) {
    this.mediaPreviews.removeAt(index);
  }

  addField(formArray: FormArray) {
    formArray.push(this.fb.control('', Validators.required));
  }

  removeField(formArray: FormArray, index: number) {
    if (formArray.length > 1) {
      formArray.removeAt(index);
    }
  }

  async onSubmit(): Promise<void> {
    const userid = this.authService.getUserid()!;
    if (!userid) {
      console.error("❌ No userid found in authService");
      return;
    }

    const payload = {
      userid,
      username: this.profileForm.get('name')?.value,
      email: this.profileForm.get('email')?.value,
      linkedin: this.profileForm.get('linkedin')?.value,
      facebook: this.profileForm.get('facebook')?.value,
      designation: this.profileForm.get('designation')?.value,
      about: this.profileForm.get('about')?.value
    };

    this.http.post(this.APIURL + 'update_user_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'updated') {
          this.showMessage("User Details Updated", "success");
          this.getUserDetails(userid);  
        } else {
          this.showMessage("Update failed", "error");
          console.warn("⚠️ Update failed:", response.message);
        }
      },
      error: (error) => {
        this.showMessage("Error updating user details", "error");
        console.error('❌ Error updating user details:', error);
      }
    });
  }

  toggleDropdown(tool: Tool, event: Event) {
    event.stopPropagation();
    this.toolsArray.forEach(t => {
      if (t !== tool) t.showDropdown = false;
    });
    tool.showDropdown = !tool.showDropdown;
  }

 // ✅ Alternative: More comprehensive approach
@HostListener('document:click', ['$event'])
clickOutside(event: Event) {
  const target = event.target as HTMLElement;
  
  // ✅ Technology dropdown - only close if clicked outside
  const clickedInsideTechnology = target.closest('.technology-selector') || 
                                   target.closest('.technology-dropdown') ||
                                   target.classList.contains('technology-input') ||
                                   target.classList.contains('technology-dropdown-item');
  
  if (!clickedInsideTechnology) {
    this.showTechnologyDropdown = false;
  }
  
  // Tools dropdown
  const clickedInsideTool = target.closest('.tool-card') || 
                            target.closest('.tool-dropdown');
  if (!clickedInsideTool) {
    this.toolsArray.forEach(t => t.showDropdown = false);
  }
  
  // Reviews dropdown
  const clickedInsideReview = target.closest('.review-card') || 
                              target.closest('.review-dropdown');
  if (!clickedInsideReview) {
    this.reviewsArray.forEach(r => r.showDropdown = false);
  }
}
  onEditProduct(tool: Tool) {
  }

  onDeleteProduct(tool: Tool) {
  }

  toggleReviewDropdown(review: Review, event: Event) {
    event.stopPropagation();
    this.reviewsArray.forEach(r => {
      if (r !== review) r.showDropdown = false;
    });
    review.showDropdown = !review.showDropdown;
  }

  onDeleteReviewPopUp(review: Review) {
    this.showReviewDeleteConfirm = true;
    this.selectedReview = review;
  }

  onDeleteReview(): void {
    if (!this.selectedReview) return;

    const payload = {
      userid: this.userid,
      reviewid: this.selectedReview.reviewid
    };

    this.http.post(this.APIURL + 'delete_review', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'deleted') {
          this.showMessage("Review deleted successfully", "success");

          this.showReviewDeleteConfirm = false;

          this.reviewsArray = this.reviewsArray.filter(
            (r: any) => r.reviewid !== this.selectedReview.reviewid
          );
        }
      },
      error: (error) => {
        this.showMessage("Error deleting review", "error");
        console.error('❌ Error deleting review:', error);
      }
    });
  }
}