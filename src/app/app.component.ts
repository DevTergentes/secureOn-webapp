// app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';
import { FooterComponent } from './shared/footer/footer/footer.component';
import { AuthService } from './Auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToolbarComponent, FooterComponent, CommonModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'secureon-webapp';
  isAuthenticated$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit() {
    console.log('AppComponent ngOnInit - Current path:', window.location.pathname);
    // Verificar el estado solo si estamos en una ruta que no sea login o signup
    if (!['/login', '/signup'].includes(window.location.pathname)) {
      console.log('Checking initial auth state...');
      this.authService.checkInitialAuthState();
    } else {
      console.log('On login/signup page, ensuring not authenticated');
      this.authService.setAuthenticated(false);
    }
  }
}
