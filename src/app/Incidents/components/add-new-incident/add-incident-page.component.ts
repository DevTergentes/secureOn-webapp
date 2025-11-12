import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseService } from '../../../shared/services/base.service';
import { IncidentService, Service } from '../../services/incident.service';
import { Delivery } from '../../../Management/deliveries/model/delivery';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-add-incident-page',
    imports: [
        CommonModule, 
        FormsModule, 
        MatSelectModule, 
        MatInputModule, 
        MatButtonModule, 
        MatFormFieldModule,
        MatCardModule,
        MatIconModule
    ],
    templateUrl: './add-incident-page.component.html',
    styleUrls: ['./add-incident-page.component.css']
})
export class AddIncidentPageComponent implements OnInit {
  incident = {
    incidentPlace: '',
    description: '',
    date: '',
    serviceId: 0
  };

  deliveries: Delivery[] = [];
  services: Service[] = [];
  userRole: string | null = null;
  userId: number | null = null;
  selectedDeliveryId: number | null = null;
  
  // Validación de fechas
  minDate: string = '';
  maxDate: string = '';
  dateError: string = '';
  
  // Validaciones de campos
  placeError: string = '';
  descriptionError: string = '';
  deliveryError: string = '';

  constructor(
    private router: Router, 
    private baseService: BaseService,
    private incidentService: IncidentService
  ) {
    // Obtener información del usuario
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.userRole = user.role;
      this.userId = user.id;
    }
  }

  ngOnInit() {
    this.initializeDateLimits();
    this.loadUserDeliveries();
  }

  private initializeDateLimits(): void {
    // Obtener fecha actual en Lima
    const now = new Date();
    const limaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    // Solo permitir fechas del año actual (2025)
    const startOfYear = new Date(2025, 0, 1); // 1 de enero de 2025
    
    // Para asegurar que es 11 de noviembre como máximo
    const nov11_2025 = new Date(2025, 10, 11); // Mes 10 = noviembre (0-indexado)
    
    // Usar la fecha menor entre hoy y 11 de noviembre 2025
    const maxAllowedDate = limaTime <= nov11_2025 ? limaTime : nov11_2025;

    // Formato YYYY-MM-DD para input date
    this.minDate = startOfYear.toISOString().split('T')[0];
    this.maxDate = maxAllowedDate.toISOString().split('T')[0];
    
    // Establecer fecha por defecto como hoy (11 de noviembre 2025)
    this.incident.date = this.maxDate;
  }

  validateDate(): void {
    if (!this.incident.date) {
      this.dateError = 'La fecha es requerida';
      return;
    }

    const selectedDate = new Date(this.incident.date + 'T12:00:00'); // Agregar hora para evitar problemas
    
    // Verificar si la fecha es válida
    if (isNaN(selectedDate.getTime())) {
      this.dateError = 'Fecha inválida';
      return;
    }

    // Obtener fecha actual en Lima
    const now = new Date();
    const limaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    
    // Solo permitir fechas del año 2025
    const startOfYear = new Date(2025, 0, 1);
    const nov11_2025 = new Date(2025, 10, 11); // 11 de noviembre 2025
    
    // Usar fecha de Lima o 11 de noviembre como máximo
    const maxAllowedDate = limaTime <= nov11_2025 ? limaTime : nov11_2025;

    if (selectedDate > maxAllowedDate) {
      this.dateError = 'No puedes seleccionar una fecha futura (máximo 11 de noviembre 2025)';
      return;
    }

    if (selectedDate < startOfYear) {
      this.dateError = 'Solo se permiten fechas del año 2025';
      return;
    }

    this.dateError = '';
  }

  validatePlace(): void {
    if (!this.incident.incidentPlace || this.incident.incidentPlace.trim().length === 0) {
      this.placeError = 'El lugar del incidente es requerido';
      return;
    }
    if (this.incident.incidentPlace.trim().length < 5) {
      this.placeError = 'El lugar debe tener al menos 5 caracteres';
      return;
    }
    this.placeError = '';
  }

  validateDescription(): void {
    if (!this.incident.description || this.incident.description.trim().length === 0) {
      this.descriptionError = 'La descripción es requerida';
      return;
    }
    if (this.incident.description.trim().length < 10) {
      this.descriptionError = 'La descripción debe tener al menos 10 caracteres';
      return;
    }
    this.descriptionError = '';
  }

  validateDelivery(): void {
    if (!this.selectedDeliveryId) {
      this.deliveryError = 'Debes seleccionar un delivery';
      return;
    }
    this.deliveryError = '';
  }

  loadUserDeliveries() {
    if (!this.userId) {
      return;
    }

    // Usar la MISMA lógica que funciona en deliveries.component.ts
    this.baseService.getEmployeesByUserId(this.userId).subscribe({
      next: (employees: any[]) => {
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          
          this.baseService.getDeliveries().subscribe({
            next: (data: Delivery[]) => {
              // Aplicar el mismo filtro que en deliveries.component.ts para empleados
              const employeeDeliveries = Array.isArray(data)
                ? data.filter(delivery =>
                    delivery.state === 'PENDING' ||
                    (
                      delivery.employeeId === employeeId &&
                      (delivery.state === 'IN_PROGRESS' || delivery.state === 'COMPLETED')
                    )
                  )
                : [];
              
              // Filtrar solo los que están en estado válido para reportar incidentes
              this.deliveries = employeeDeliveries.filter(delivery => 
                delivery.state === 'ACCEPTED' || delivery.state === 'IN_PROGRESS'
              );
            },
            error: (error) => {
              this.deliveries = [];
            }
          });
        } else {
          this.deliveries = [];
        }
      },
      error: (err) => {
        this.deliveries = [];
      }
    });
  }

  onDeliveryChange() {
    if (!this.selectedDeliveryId) return;
    
    // Cargar servicios asociados al delivery seleccionado
    this.incidentService.getServices().subscribe({
      next: (services: Service[]) => {
        this.services = services.filter(service => 
          service.deliveryId === this.selectedDeliveryId
        );
      },
      error: (err) => {
      }
    });
  }

  onSave() {
    // Validar todos los campos
    this.validateDelivery();
    this.validatePlace();
    this.validateDescription();
    this.validateDate();

    // Verificar campos básicos requeridos
    if (!this.selectedDeliveryId) {
      alert('Por favor selecciona un delivery');
      return;
    }
    if (!this.incident.incidentPlace.trim()) {
      alert('Por favor ingresa el lugar del incidente');
      return;
    }
    if (!this.incident.description.trim()) {
      alert('Por favor ingresa la descripción del incidente');
      return;
    }
    if (!this.incident.date) {
      alert('Por favor selecciona la fecha del incidente');
      return;
    }

    // Si no hay servicios disponibles, usar ID por defecto
    const serviceId = this.services.length > 0 ? this.incident.serviceId : 1;

    // Asegurar que la fecha sea válida y en formato correcto
    const selectedDate = new Date(this.incident.date);
    if (isNaN(selectedDate.getTime())) {
      alert('Por favor selecciona una fecha válida');
      return;
    }

    const incidentData = {
      incidentPlace: this.incident.incidentPlace.trim(),
      description: this.incident.description.trim(),
      date: selectedDate.toISOString(),
      deliveryId: this.selectedDeliveryId,
      serviceId: serviceId
    };

    this.incidentService.createIncident(incidentData).subscribe({
      next: (response) => {
        alert('Incidente reportado exitosamente');
        this.router.navigate(['/incidents']);
      },
      error: (error) => {
        alert('Error al reportar el incidente. Intenta nuevamente.');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/incidents']);
  }
}
