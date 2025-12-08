import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/getuserid.service';
import { environment } from '../../environments/environment';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, SearchBarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit {
  dropdownOpen: boolean = false;
  showLogoutConfirm: boolean = false;
  userid: string = '';
  userInitials: string = '';
  isuserloggedin: boolean = false;
  APIURL = environment.APIURL;

  activeTab: string | null = null;
  
  // Show all flags
  showAllCategories: boolean = false;
  showAllUseCases: boolean = false;
  showAllTechnologies: boolean = false;

  // Filter Dropdown State
  filterDropdownOpen: boolean = false;
  selectedFilter: string | null = null;
  expandedFilters: { [key: string]: boolean } = {
    categories: false,
    usecases: false,
    technology: false
  };

  // Filter Options
  filterOptions = [
    { label: 'Categories', key: 'categories', icon: '' },
    { label: 'Use Cases', key: 'usecases', icon: '' },
    { label: 'Technology', key: 'technology', icon: '' }
  ];

  // Tabs
  tabs = [
    { label: 'Categories', key: 'categories' },
    { label: 'Use Cases', key: 'usecases' },
    { label: 'Technology', key: 'technology' }
  ];

  // Categories
  categories: any[] = [];

  // Use Cases
  useCases: any[] = [];

  // Technologies
  technologies: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userid = this.authService.getUserid()!;
    this.loadCategories();
    this.loadUsecases();
    this.loadTechnologies();

    if (this.userid) {
      this.isuserloggedin = true;
      this.getUserDetails(this.userid);
    } else {
      this.isuserloggedin = false;
    }

    // Set default selected filter
    this.selectedFilter = 'categories';
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
    this.http.get(this.APIURL + `get_usecases`).subscribe({
      next: (response: any) => {
        if (response.message === "Use cases retrieved successfully") {
          this.useCases = response.usecases.map((u: any) => ({
            id: u.id,
            usecaseid: u.usecaseadminid,
            usecaseName: u.usecaseName,
            createdDate: new Date(u.createdDate)
          }));
        } else {
          this.useCases = [];
        }
      },
      error: (error) => {
        console.error('Error loading use cases:', error);
        alert("Failed to load use cases. Please try again.");
        this.useCases = [];
      }
    });
  }

  async loadCategories(): Promise<void> {
    this.http.get(this.APIURL + `get_categories`).subscribe({
      next: (response: any) => {
        if (response.message === "Categories retrieved successfully") {
          this.categories = response.categories.map((c: any) => ({
            id: c.id,
            categoryid: c.categoryid,
            categoryName: c.categoryName,
            createdDate: new Date(c.createdDate)
          }));
        } else {
          this.categories = [];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        alert("Failed to load categories. Please try again.");
        this.categories = [];
      }
    });
  }

  // ========================================
  //  FILTER DROPDOWN METHODS
  // ========================================

  /**
   * Toggle filter dropdown visibility
   */
  toggleFilterDropdown(): void {
    this.filterDropdownOpen = !this.filterDropdownOpen;
    
    // Close other dropdowns
    if (this.filterDropdownOpen) {
      this.dropdownOpen = false;
      this.activeTab = null;
      
      // Set default selected filter if not set
      if (!this.selectedFilter) {
        this.selectedFilter = 'categories';
      }
    } else {
      this.selectedFilter = null;
    }
  }

  /**
   * Close filter dropdown
   */
  closeFilterDropdown(): void {
    this.filterDropdownOpen = false;
    this.selectedFilter = null;
    // Reset expanded states
    this.expandedFilters = {
      categories: false,
      usecases: false,
      technology: false
    };
  }

  /**
   * Select a filter category
   */
  selectFilter(filterKey: string): void {
    this.selectedFilter = filterKey;
  }

  /**
   * Get count for a filter category
   */
  getFilterCount(filterKey: string): number {
    switch (filterKey) {
      case 'categories':
        return this.categories.length;
      case 'usecases':
        return this.useCases.length;
      case 'technology':
        return this.technologies.length;
      default:
        return 0;
    }
  }

  /**
   * Get filtered items based on expanded state
   */
  getFilteredItems(filterKey: string): any[] {
    const limit = 8; // Show 8 items by default
    
    switch (filterKey) {
      case 'categories':
        return this.expandedFilters['categories'] 
          ? this.categories 
          : this.categories.slice(0, limit);
      
      case 'usecases':
        return this.expandedFilters['usecases'] 
          ? this.useCases 
          : this.useCases.slice(0, limit);
      
      case 'technology':
        return this.expandedFilters['technology'] 
          ? this.technologies 
          : this.technologies.slice(0, limit);
      
      default:
        return [];
    }
  }

  /**
   * Expand/collapse filter items
   */
  expandFilter(filterKey: string): void {
    this.expandedFilters[filterKey] = !this.expandedFilters[filterKey];
  }

  // ========================================
  //  EXISTING TAB DROPDOWN METHODS
  // ========================================

  /**
   * Toggle tab dropdown
   */
  toggleTab(tab: string): void {
    if (this.activeTab === tab) {
      this.activeTab = null;
    } else {
      this.activeTab = tab;
      // Close filter dropdown
      this.filterDropdownOpen = false;
      this.selectedFilter = null;
      
      // Reset show all flags when switching tabs
      this.showAllCategories = false;
      this.showAllUseCases = false;
      this.showAllTechnologies = false;
    }
  }

  /**
   * Toggle show all items
   */
  toggleShowAll(type: string): void {
    if (type === 'categories') {
      this.showAllCategories = !this.showAllCategories;
    } else if (type === 'usecases') {
      this.showAllUseCases = !this.showAllUseCases;
    } else if (type === 'technology') {
      this.showAllTechnologies = !this.showAllTechnologies;
    }
  }

  /**
   * Close dropdown when item is clicked
   */
  closeDropdown(): void {
    this.activeTab = null;
    this.showAllCategories = false;
    this.showAllUseCases = false;
    this.showAllTechnologies = false;
  }

  // ========================================
  //  USER METHODS
  // ========================================

  async getUserDetails(userid: string): Promise<void> {
    const payload = { userid };

    this.http.post(this.APIURL + 'get_user_details', payload).subscribe({
      next: (response: any) => {
        if (response.message === 'yes') {
          const user = response.user;
          this.userInitials = this.generateInitials(user.username || '');
        } else {
          console.warn("No user found");
        }
      },
      error: (error) => {
        console.error('❌ Error fetching user details:', error);
      }
    });
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

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    
    // Close other dropdowns
    if (this.dropdownOpen) {
      this.filterDropdownOpen = false;
      this.selectedFilter = null;
      this.activeTab = null;
    }
  }

  showlogoutpopup(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.showLogoutConfirm = true;
  }

  onLogout(): void {
    this.showLogoutConfirm = false;
    sessionStorage.removeItem('userid');
    this.router.navigate(['/home/dashboard']);
    this.isuserloggedin = false;
    this.dropdownOpen = false;
  }

  // ========================================
  //  HOST LISTENERS
  // ========================================

  /**
   * Close dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close profile dropdown
    if (!target.closest('.profile-wrapper')) {
      this.dropdownOpen = false;
    }

    // Close filter dropdown
    if (!target.closest('.filter-wrapper') && !target.closest('.filter-dropdown')) {
      if (this.filterDropdownOpen) {
        // Small delay to allow click events to process
        setTimeout(() => {
          this.filterDropdownOpen = false;
          this.selectedFilter = null;
        }, 100);
      }
    }

    // Tab dropdown is handled by overlay click
  }

  /**
   * Close all dropdowns on escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.filterDropdownOpen = false;
    this.selectedFilter = null;
    this.dropdownOpen = false;
    this.activeTab = null;
  }
}