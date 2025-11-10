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
  categories: string[] = [
    'AI model', 'Agent', 'Voice', 'Image', 'Video Editing', 'Dev Tools',
    'Analytics', 'Automation', 'Security', 'Database', 'Cloud Services', 'API Tools'
  ];

  // Use Cases
  useCases = [
    { name: 'Sells', route: 'sells', type: 'usecase' },
    { name: 'Dev Tools', route: 'dev-tools', type: 'usecase' },
    { name: 'Productivity', route: 'productivity', type: 'usecase' },
    { name: 'Marketing', route: 'marketing', type: 'usecase' },
    { name: 'Design', route: 'design', type: 'usecase' },
    { name: 'Customer Support', route: 'customer-support', type: 'usecase' },
    { name: 'Finance', route: 'finance', type: 'usecase' },
    { name: 'HR Management', route: 'hr-management', type: 'usecase' }
  ];

  // Technologies
  technologies = [
    { name: 'Java', route: 'java', type: 'technology' },
    { name: 'Python', route: 'python', type: 'technology' },
    { name: 'JavaScript', route: 'javascript', type: 'technology' },
    { name: 'TypeScript', route: 'typescript', type: 'technology' },
    { name: 'C#', route: 'csharp', type: 'technology' },
    { name: 'Ruby', route: 'ruby', type: 'technology' },
    { name: 'Go', route: 'go', type: 'technology' },
    { name: 'Rust', route: 'rust', type: 'technology' }
  ];

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userid = this.authService.getUserid()!;

    if (this.userid) {
      this.isuserloggedin = true;
      this.getUserDetails(this.userid);
    } else {
      this.isuserloggedin = false;
    }
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