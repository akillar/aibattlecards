import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.css'
})
export class LogInComponent {
  loginForm: FormGroup;
  APIURL = environment.APIURL;
  message:string = '';


     constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: Router
    
  ) {
  

    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
 

  }

async onSubmitLoginDetails(): Promise<void> {
  const email = this.loginForm.get("email")?.value || '';
  const password = this.loginForm.get("password")?.value || '';

  const formData = new FormData();
 formData.append("emailaddress", email);
formData.append("password", password);
  this.http.post(this.APIURL + 'user_log_in', formData).subscribe({
    next: (response: any) => {
      if (response.message === "Please confirm the email") {
        this.showMessage('Please confirm your email before logging in.');
      } else if (response.message === "No user found") {
        this.showMessage('No user found with this email.');
      } else if (response.message === "Invalid email or password") {
        this.showMessage('Incorrect password. Please try again.');
      }  else if (response.message === "Your account has been disabled") {
        this.showMessage('Your account has been disabled.');
      } 
        
      else if (response.message === "Login successful") {
        this.route.navigate(['/home/dashboard']);
        sessionStorage.setItem('userid', response.userid);
        
        // Store the user ID or redirect
      } else {
        this.showMessage("Unexpected error: " + response.message);
  
      }
    },
    error: (error) => {
      console.error('Login failed:', error);
      alert("Server error. Please try again.");
    }
  });
}

   showMessage(msg: string) {
  this.message = msg;
  setTimeout(() => {
    this.message = '';
  }, 4000);  
} 

}
