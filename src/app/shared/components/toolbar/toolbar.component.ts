import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule  } from '@angular/material/button';
import { MatIconModule    } from '@angular/material/icon';

import { BaseService }     from '../../services/base.service';
import {NotificacionesPopupComponent} from '../../../notifications/components/notificaciones-popup.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    NotificacionesPopupComponent          // <-- importa el popup stand-alone
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent {
  showLogOutButton = true;
  showMenuIcon     = window.innerWidth <= 600;
  isMenuOpen       = false;
  userRole: string | null = null;

  /* ---- notificaciones ---- */
  showNotifications = false;
  notifications: any[] = [];

  constructor(private router: Router,
              private baseService: BaseService) {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.userRole = user.role;
    }
    this.router.events.subscribe(() => {
      const current = this.router.url;
      this.showLogOutButton = !(current === '/login' || current === '/signup');
    });
  }

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }

  @HostListener('window:resize')
  onResize() { this.showMenuIcon = window.innerWidth <= 600; }

  logOut()   { this.router.navigate(['/login']); }

  /* ------------ campana ------------ */
  onBellClick(): void {
    if (this.showNotifications) {
      this.showNotifications = false;
      return;
    }

    this.baseService.getIncidents().subscribe((data: any[]) => {
      this.notifications = data
        .sort((a, b) => {
          const at = Array.isArray(a.date) ? new Date(a.date[0], a.date[1]-1, a.date[2]).getTime()
            : new Date(a.date).getTime();
          const bt = Array.isArray(b.date) ? new Date(b.date[0], b.date[1]-1, b.date[2]).getTime()
            : new Date(b.date).getTime();
          return bt - at;
        })
        .slice(0, 6)
        .map((inc) => {
          if (Array.isArray(inc.date)) {
            const [y, m, d] = inc.date;
            inc.date = `${y}/${m}/${d}`;
          }
          return inc;
        });

      this.showNotifications = true;
    });
  }

  /* cierra popup si click fuera */
  @HostListener('document:mousedown', ['$event'])
  clickAway(e: MouseEvent) {
    const pop = document.querySelector('.notifications-popup-green');
    const bell = document.querySelector('.toolbar-bell');
    if (this.showNotifications &&
      pop  && !pop.contains(e.target as Node) &&
      bell && !bell.contains(e.target as Node)) {
      this.showNotifications = false;
    }
  }
}
