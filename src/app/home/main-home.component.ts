import { Component } from '@angular/core';
import { HeaderComponent } from '../widgets/header/header.component'; 
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../widgets/footer/footer.component';
 

@Component({
  selector: 'app-main-home',
  standalone: true,
  imports: [HeaderComponent,RouterModule,FooterComponent],
  templateUrl: './main-home.component.html',
  styleUrl: './main-home.component.css'
})
export class MainHomeComponent {

}
