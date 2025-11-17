import { Component } from '@angular/core';
import { HeaderComponent } from '../widgets/header/header.component'; 
import { RouterModule } from '@angular/router';
 

@Component({
  selector: 'app-main-home',
  standalone: true,
  imports: [HeaderComponent,RouterModule],
  templateUrl: './main-home.component.html',
  styleUrl: './main-home.component.css'
})
export class MainHomeComponent {

}
