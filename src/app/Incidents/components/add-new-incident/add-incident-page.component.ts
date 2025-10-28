import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import {BaseService} from '../../../shared/services/base.service';

@Component({
    selector: 'app-add-incident-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './add-incident-page.component.html',
    styleUrls: ['./add-incident-page.component.css']
})
export class AddIncidentPageComponent {
  incident = {
    incidentPlace: '',
    description: '',
    date: ''
  };

  constructor(private router: Router, private baseService: BaseService) {}

  onSave() {
    this.baseService.createIncident(this.incident).subscribe({
      next: () => {
        this.router.navigate(['/incidents']); // Regresa a la lista
      },
      error: (err) => {
        console.error('Error al crear el servicio:', err);
      }
    });
  }

  onCancel() {
    // Aquí puedes limpiar el formulario o navegar a otra página si es necesario
    window.history.back();
  }
}
