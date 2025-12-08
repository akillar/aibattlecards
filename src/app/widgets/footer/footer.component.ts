import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) {}

  /**
   * Navigate to policy pages
   * @param policyType - Type of policy to navigate to
   */
  navigateToPolicy(policyType: string): void {
    // Prevent default link behavior if needed
    event?.preventDefault();

    switch (policyType) {
      case 'terms':
        this.router.navigate(['/terms-and-conditions']);
        // OR use window.location if external
        // window.open('/terms-and-conditions', '_blank');
        break;

      case 'privacy':
        this.router.navigate(['/privacy-policy']);
        break;

      case 'faq':
        this.router.navigate(['/faq']);
        break;

      default:
        console.warn(`Unknown policy type: ${policyType}`);
    }

    // Optional: Scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Optional: Track social media clicks for analytics
   */
  trackSocialClick(platform: string): void {
    console.log(`Social media clicked: ${platform}`);
    
    // Add your analytics tracking here
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', 'social_click', {
    //     'platform': platform,
    //     'location': 'footer'
    //   });
    // }
  }

  /**
   * Optional: Handle keyboard navigation for accessibility
   */
  onKeyPress(event: KeyboardEvent, action: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }
}