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
    // Verificar el estado solo si estamos en una ruta que no sea login o signup
    if (!['/login', '/signup'].includes(window.location.pathname)) {
      this.authService.checkInitialAuthState();
    } else {
      this.authService.setAuthenticated(false);
    }
  }
}
