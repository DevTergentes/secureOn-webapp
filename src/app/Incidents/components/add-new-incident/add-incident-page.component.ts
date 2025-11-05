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
    console.log('Usuario logueado:', this.userRole, 'ID:', this.userId);
    this.loadUserDeliveries();
    this.incident.date = new Date().toISOString().split('T')[0]; // Fecha actual
  }

  loadUserDeliveries() {
    if (!this.userId) {
      console.log('❌ No se encontró userId');
      return;
    }

    console.log('🔄 Cargando deliveries para userId usando la lógica que funciona:', this.userId);

    // Usar la MISMA lógica que funciona en deliveries.component.ts
    this.baseService.getEmployeesByUserId(this.userId).subscribe({
      next: (employees: any[]) => {
        console.log('👥 Empleados encontrados:', employees);
        
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          console.log('🆔 EmployeeId obtenido:', employeeId);
          
          this.baseService.getDeliveries().subscribe({
            next: (data: Delivery[]) => {
              console.log('📦 Todos los deliveries:', data);
              
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
              
              console.log('📋 Deliveries filtrados para empleado:', employeeDeliveries);
              
              // Filtrar solo los que están en estado válido para reportar incidentes
              this.deliveries = employeeDeliveries.filter(delivery => 
                delivery.state === 'ACCEPTED' || delivery.state === 'IN_PROGRESS'
              );
              
              console.log('✅ Deliveries finales para reportar incidentes:', this.deliveries);
              
              if (this.deliveries.length === 0) {
                console.log('⚠️ No hay deliveries en estado válido para reportar incidentes');
              }
            },
            error: (error) => {
              console.error('❌ Error loading deliveries:', error);
              this.deliveries = [];
            }
          });
        } else {
          console.error('❌ No employee found for user id', this.userId);
          this.deliveries = [];
        }
      },
      error: (err) => {
        console.error('❌ Error fetching employee by userId:', err);
        this.deliveries = [];
      }
    });
  }

  onDeliveryChange() {
    if (!this.selectedDeliveryId) return;
    
    console.log('Delivery seleccionado:', this.selectedDeliveryId);
    
    // Cargar servicios asociados al delivery seleccionado
    this.incidentService.getServices().subscribe({
      next: (services: Service[]) => {
        this.services = services.filter(service => 
          service.deliveryId === this.selectedDeliveryId
        );
        console.log('Servicios encontrados:', this.services);
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
      }
    });
  }

  onSave() {
    if (!this.selectedDeliveryId) {
      alert('Por favor selecciona un delivery');
      return;
    }

    // Si no hay servicios disponibles, usar ID por defecto
    const serviceId = this.services.length > 0 ? this.incident.serviceId : 1;

    const incidentData = {
      incidentPlace: this.incident.incidentPlace,
      description: this.incident.description,
      date: new Date(this.incident.date).toISOString(),
      deliveryId: this.selectedDeliveryId,
      serviceId: serviceId
    };

    console.log('💾 Guardando incidente:', incidentData);

    this.incidentService.createIncident(incidentData).subscribe({
      next: (response) => {
        console.log('✅ Incidente creado exitosamente:', response);
        alert('Incidente reportado exitosamente');
        this.router.navigate(['/incidents']);
      },
      error: (error) => {
        console.error('❌ Error al crear incidente:', error);
        alert('Error al reportar el incidente. Intenta nuevamente.');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/incidents']);
  }
}
