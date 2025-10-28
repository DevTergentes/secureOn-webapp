import { Component, OnInit } from '@angular/core';
import { Device } from '../../../deliveries/model/device.model';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseSensorService } from '../../../../shared/services/base.sensor.service';
import { MatCard } from '@angular/material/card';
import { NgIf, NgForOf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Record } from '../../model/record.model';
import { Delivery } from '../../../deliveries/model/delivery';

@Component({
  selector: 'app-report',
  imports: [
    MatCard,
    NgIf,
    NgForOf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  records: Record[] = [];         // CAMBIO: ahora es un array
  delivery: Delivery | null = null;
  deliveryId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private baseSensorService: BaseSensorService
  ) {}

  ngOnInit(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('id');
    if (this.deliveryId) {
      this.loadReport(this.deliveryId);
    }
  }

  loadReport(id: string): void {
    this.baseSensorService.getRecordsByDeliveryId(id).subscribe(
      (data: Record[]) => {
        this.records = data;    // CAMBIO: guarda todos los records
        console.log('Records:', this.records);
      },
      (error) => {
        console.error('Error al cargar el sensor:', error);
      }
    );
  }

  returnToDeliveries(): void {
    this.router.navigate(['/deliveries']);
  }
}
