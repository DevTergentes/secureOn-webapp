import { Component, OnInit } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { NgIf, NgForOf, NgClass } from '@angular/common'; // <-- ¡Importa NgForOf y NgClass aquí!
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseService } from '../../../../shared/services/base.service';
import { Delivery } from '../../model/delivery';
import { ActivatedRoute, Router } from '@angular/router';
import { Device } from '../../model/device.model';
import { BaseSensorService } from '../../../../shared/services/base.sensor.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-delivery-details',
  imports: [
    MatCard,
    NgIf,
    NgForOf,   // <-- agrega esto
    NgClass,   // <-- y esto
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './delivery-details.component.html',
  styleUrl: './delivery-details.component.css'
})
export class DeliveryDetailsComponent implements OnInit {
  delivery: Delivery | null = null;
  deliveryId: string | null = null;
  device: Device | null = null;
  latestRecord: any = null;
  records: any[] = [];

  constructor(
    private baseService: BaseService,
    private route: ActivatedRoute,
    private router: Router,
    private baseSensorService: BaseSensorService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('id');
    if (this.deliveryId) {
      this.loadServices(this.deliveryId);
      this.loadSensorByDeliveryId(this.deliveryId);
      this.loadLatestRecord(this.deliveryId);
      this.loadRecordsByDeliveryId(this.deliveryId);
    }
  }

  loadServices(id: string): void {
    this.baseService.getDeliveryById(id).subscribe(data => {
      this.delivery = data;
      console.log('Deliveries:', this.delivery);
    });
  }

  loadRecordsByDeliveryId(deliveryId: string): void {
    this.baseService.getRecordsByDeliveryId(deliveryId).subscribe(
      (data) => {
        this.records = data;
        console.log('Records de la entrega:', this.records);
      },
      (error) => {
        console.error('Error al cargar los records:', error);
      }
    );
  }

  loadSensorByDeliveryId(deliveryId: string): void {
    this.baseSensorService.getSensorByDeliveryId(deliveryId).subscribe(
      (data: Device[]) => {
        this.device = data.length > 0 ? data[0] : null;
        console.log('Sensor:', this.device);
      },
      (error) => {
        console.error('Error al cargar el sensor:', error);
      }
    );
  }

  loadLatestRecord(deliveryId: string): void {
    this.baseService.getLatestRecordByDeliveryId(deliveryId).subscribe(
      (data) => {
        this.latestRecord = data;
        console.log('Último record:', this.latestRecord);
      },
      (error) => {
        console.error('Error al cargar el último record:', error);
      }
    );
  }

  getMapUrl(lat: number, lng: number): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  markAsCompleted(): void {
    if (this.delivery && this.delivery.id) {
      this.baseService.updateDeliveryStateCompleted(this.delivery.id).subscribe({
        next: () => {
          console.log('Delivery marcado como completado');
          this.returnToDeliveries();
        },
        error: (err) => {
          console.error('Error al marcar como completado:', err);
        }
      });
    }
  }

  returnToDeliveries(): void {
    this.router.navigate(['/deliveries']);
  }
}
