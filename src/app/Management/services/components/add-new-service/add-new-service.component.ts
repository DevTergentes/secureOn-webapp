import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router} from '@angular/router';
import {BaseService} from '../../../../shared/services/base.service';

@Component({
    selector: 'app-add-new-service',
    imports: [
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './add-new-service.component.html',
    styleUrl: './add-new-service.component.css'
})
export class AddNewServiceComponent {
  service = {
    nameService: '',
    description: '',
    incidents: ''
  };

  constructor(private router: Router, private baseService: BaseService) {}

  onSave() {
    this.baseService.createService(this.service).subscribe({
      next: () => {
        this.router.navigate(['/services']); // Regresa a la lista
      },
      error: (err) => {
        console.error('Error al crear el servicio:', err);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/services']);
  }
}
