import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { MatIconModule }  from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notificaciones-popup',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './notificaciones-popup.component.html',
  styleUrls: ['./notificaciones-popup.component.css']
})
export class NotificacionesPopupComponent {
  /** Notificaciones que llegan del padre */
  @Input() notifications: any[] = [];

  /** Emite al padre cuando se debe cerrar */
  @Output() close = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  /** Cierra si hacen clic fuera */
  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }

  /** Cierra con ESC */
  @HostListener('document:keydown.escape')
  onEsc() {
    this.close.emit();
  }

  /** Cierra desde botones del template */
  closePopup() {
    this.close.emit();
  }
}
