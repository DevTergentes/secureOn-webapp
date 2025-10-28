import { Component, OnInit } from '@angular/core';
import { Delivery } from '../../model/delivery';
import { BaseService } from '../../../../shared/services/base.service';
import { Router, RouterLink } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddDeliveryPageComponent } from '../add-delivery-dialog/add-delivery-page.component';

@Component({
  selector: 'app-deliveries',
  templateUrl: './deliveries.component.html',
  imports: [
    NgForOf,
    NgIf,
    MatIconButton,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  styleUrl: './deliveries.component.css'
})
export class DeliveriesComponent implements OnInit {
  deliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  searchText: string = '';
  userRole: string | null = null;
  userId: number = 0;

  constructor(
    private baseService: BaseService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      const role = user.role;
      const userId = user.id;
      this.userId = user.id;
      this.userRole = user.role;

      if (role === 'COMPANY' && userId) {
        this.loadDeliveriesByOwnerId(userId);
      } else if (role === 'EMPLOYEE') {
        this.loadDeliveries(userId);
      }
    }
  }

  loadDeliveriesByOwnerId(ownerId: number): void {
    this.baseService.getDeliveries().subscribe(
      (data: Delivery[]) => {
        this.deliveries = data.filter(delivery => delivery.ownerId == ownerId);
        this.filteredDeliveries = this.deliveries;
      },
      (error) => {
        console.error('Error loading deliveries by userId:', error);
      }
    );
  }

  // ACTUALIZADO: Consigue employeeId real y filtra con ese ID
  loadDeliveries(userId: number): void {
    this.baseService.getEmployeesByUserId(userId).subscribe({
      next: (employees: any[]) => {
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          this.baseService.getDeliveries().subscribe(
            (data: Delivery[]) => {
              this.deliveries = Array.isArray(data)
                ? data.filter(delivery =>
                  delivery.state === 'PENDING' ||
                  (
                    delivery.employeeId === employeeId &&
                    (delivery.state === 'IN_PROGRESS' || delivery.state === 'COMPLETED')
                  )
                )
                : [];
              this.filteredDeliveries = this.deliveries;
            },
            (error) => {
              console.error('Error loading deliveries:', error);
            }
          );
        } else {
          this.deliveries = [];
          this.filteredDeliveries = [];
          console.error('No employee found for user id', userId);
        }
      },
      error: (err) => {
        this.deliveries = [];
        this.filteredDeliveries = [];
        console.error('Error fetching employee by userId:', err);
      }
    });
  }

  onDetails(delivery: Delivery): void {
    console.log('Accepted:', delivery);
    this.router.navigate(['/delivery-details', delivery.id]);
  }

  onReport(delivery: Delivery): void {
    console.log('Report:', delivery);
    this.router.navigate(['/delivery-report', delivery.id]);
  }

  // ACTUALIZADO: Obtiene el employeeId desde la API y lo usa para aceptar
  onAccept(delivery: Delivery): void {
    this.baseService.getEmployeesByUserId(this.userId).subscribe({
      next: (employees: any[]) => {
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          this.baseService.updateDeliveryStateInProgress(delivery.id, employeeId).subscribe({
            next: () => {
              console.log('Delivery aceptado:', delivery);
              this.loadDeliveries(this.userId); // Recargar la lista
            },
            error: (err) => {
              console.error('Error al aceptar el delivery:', err);
            }
          });
        } else {
          console.error('No employee found for user id', this.userId);
        }
      },
      error: (err) => {
        console.error('Error fetching employee by userId:', err);
      }
    });
  }

  onDelete(delivery: Delivery, userId: number): void {
    this.baseService.deleteDelivery(delivery.id).subscribe({
      next: () => {
        console.log('Delivery eliminado:', delivery);
        this.loadDeliveries(userId); // Recargar la lista de deliveries
      },
      error: (err) => {
        console.error('Error al eliminar el delivery:', err);
      }
    });
  }

  filterDeliveries(): void {
    this.filteredDeliveries = this.deliveries.filter((incident) =>
      incident.destination.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
}
