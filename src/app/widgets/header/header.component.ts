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

  // Tabs
  tabs = [
    { label: 'Categories', key: 'categories' },
    { label: 'Use Cases', key: 'usecases' },
    { label: 'Technology', key: 'technology' }
  ];

  // Categories (add more items to test "See More")
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
  }


  async loadTechnologies(): Promise<void> {
    this.http.get(this.APIURL + `get_technologies`).subscribe({
      next: (response: any) => {
        if (response.message === "Technologies retrieved successfully") {
          // Map the response to technologies array
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
          // Map the response to usecases array
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
          // Map the response to categories array
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



  // Toggle tab dropdown
  toggleTab(tab: string) {
    if (this.activeTab === tab) {
      this.activeTab = null;
    } else {
      this.activeTab = tab;
      // Reset show all flags when switching tabs
      this.showAllCategories = false;
      this.showAllUseCases = false;
      this.showAllTechnologies = false;
    }
  }

  // Toggle show all items
  toggleShowAll(type: string) {
    if (type === 'categories') {
      this.showAllCategories = !this.showAllCategories;
    } else if (type === 'usecases') {
      this.showAllUseCases = !this.showAllUseCases;
    } else if (type === 'technology') {
      this.showAllTechnologies = !this.showAllTechnologies;
    }
  }

  // Close dropdown when item is clicked
  closeDropdown() {
    this.activeTab = null;
    this.showAllCategories = false;
    this.showAllUseCases = false;
    this.showAllTechnologies = false;
  }

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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  showlogoutpopup(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.showLogoutConfirm = true;
  }

  onLogout() {
    this.showLogoutConfirm = false;
    sessionStorage.removeItem('userid');
    this.router.navigate(['/home/dashboard']);
    this.isuserloggedin = false;
    this.dropdownOpen = false;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    
    // Close profile dropdown
    if (!target.closest('.profile-wrapper')) {
      this.dropdownOpen = false;
    }

    // Close tab dropdown (handled by overlay click)
  }
}