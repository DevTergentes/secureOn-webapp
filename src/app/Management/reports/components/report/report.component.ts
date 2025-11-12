import { Component, OnInit } from '@angular/core';
import { Device } from '../../../deliveries/model/device.model';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseSensorService } from '../../../../shared/services/base.sensor.service';
import { MatCard, MatCardModule } from '@angular/material/card';
import { NgIf, NgForOf, DatePipe, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Record } from '../../model/record.model';
import { Delivery } from '../../../deliveries/model/delivery';
import { BaseService } from '../../../../shared/services/base.service';
import { IncidentService } from '../../../../Incidents/services/incident.service';
import { Incident } from '../../../../Incidents/model/incident';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-report',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  records: Record[] = [];
  delivery: Delivery | null = null;
  incidents: Incident[] = [];
  automaticIncidents: any[] = []; // For sensor-generated incidents
  deliveryId: string | null = null;
  loading = false;
  reportDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private baseSensorService: BaseSensorService,
    private baseService: BaseService,
    private incidentService: IncidentService
  ) {}

  ngOnInit(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('id');
    if (this.deliveryId) {
      this.loadCompleteReport(this.deliveryId);
    }
  }

  loadCompleteReport(id: string): void {
    this.loading = true;
    
    console.log('Loading report for delivery ID:', id);
    
    // Cargar toda la información en paralelo
    forkJoin({
      delivery: this.baseService.getDeliveryById(id),
      manualIncidents: this.incidentService.getIncidentsByDelivery(Number(id)),
      sensorRecords: this.baseSensorService.getRecordsByDeliveryId(id)
    }).subscribe({
      next: (data) => {
        console.log('Data loaded successfully:', data);
        console.log('Delivery:', data.delivery);
        console.log('Manual incidents count:', data.manualIncidents?.length || 0);
        console.log('Manual incidents data:', data.manualIncidents);
        console.log('Sensor records count:', data.sensorRecords?.length || 0);
        console.log('Sensor records data:', data.sensorRecords);
        
        this.delivery = data.delivery;
        this.records = data.sensorRecords || [];
        this.incidents = data.manualIncidents || [];
        
        // Detect automatic incidents from sensor records
        if (data.sensorRecords && data.sensorRecords.length > 0) {
          console.log('Processing sensor records for automatic incidents...');
          console.log('Sensor records sample:', data.sensorRecords.slice(0, 3));
          this.automaticIncidents = this.incidentService.detectAutomaticIncidents(data.sensorRecords);
          console.log('Automatic incidents detected:', this.automaticIncidents.length);
          console.log('Automatic incidents data:', this.automaticIncidents);
        } else {
          console.log('No sensor records available for automatic incident detection');
          this.automaticIncidents = [];
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading report data:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        
        // Try to load at least the manual incidents and delivery data
        console.log('Attempting to load partial data...');
        forkJoin({
          delivery: this.baseService.getDeliveryById(id),
          manualIncidents: this.incidentService.getIncidentsByDelivery(Number(id))
        }).subscribe({
          next: (partialData) => {
            console.log('Partial data loaded:', partialData);
            this.delivery = partialData.delivery;
            this.incidents = partialData.manualIncidents || [];
            this.records = [];
            this.automaticIncidents = [];
            this.loading = false;
            
            console.log(`Report loaded with ${this.incidents.length} manual incidents only`);
          },
          error: (partialError) => {
            console.error('Failed to load even partial data:', partialError);
            this.loading = false;
          }
        });
      }
    });
  }



  returnToDeliveries(): void {
    this.router.navigate(['/deliveries']);
  }

  async downloadPDF(): Promise<void> {
    const reportElement = document.getElementById('complete-report');
    if (!reportElement) return;

    try {
      // Configurar opciones para html2canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Añadir primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Añadir páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Descargar el PDF
      const deliveryNumber = this.delivery?.id || 'delivery';
      const fileName = `reporte-delivery-${deliveryNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      alert('Error al generar el PDF. Intenta nuevamente.');
    }
  }

  formatDate(dateString: string | Date | number[] | any): string {
    if (!dateString) return 'No disponible';
    
    try {
      // Si es un array (formato del backend: [2025, 11, 12, 0, 0])
      if (Array.isArray(dateString) && dateString.length >= 3) {
        const [year, month, day] = dateString;
        const date = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-based months
        return date.toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/Lima'
        });
      }
      
      if (typeof dateString === 'string') {
        // Manejar diferentes formatos de fecha
        if (dateString.includes(',')) {
          // Formato: "2025,11,11,0,0"
          const parts = dateString.split(',').map(p => parseInt(p.trim()));
          if (parts.length >= 3) {
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Lima'
            });
          }
        }
        
        // Formato ISO
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Lima'
          });
        }
      }
      
      if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        return dateString.toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/Lima'
        });
      }
      
      return 'Fecha inválida';
    } catch (error) {
      return 'Error al formatear fecha';
    }
  }

  getSensorStatusClass(record: Record): string {
    const gasHigh = record.gasValue > 50;
    const tempHigh = record.temperatureValue > 35 || record.temperatureValue < 5;
    const heartHigh = record.heartRateValue > 100 || record.heartRateValue < 60;
    
    if (gasHigh || tempHigh || heartHigh) {
      return 'status-danger';
    } else if (record.gasValue > 30 || record.temperatureValue > 30 || record.heartRateValue > 90) {
      return 'status-warning';
    }
    return 'status-normal';
  }

  getIncidentSeverity(incident: Incident): string {
    // Basado en palabras clave en la descripción
    const desc = incident.description.toLowerCase();
    if (desc.includes('crítico') || desc.includes('emergency') || desc.includes('peligro')) {
      return 'Crítico';
    } else if (desc.includes('alerta') || desc.includes('warning') || desc.includes('problema')) {
      return 'Alto';
    }
    return 'Medio';
  }

  // Métodos auxiliares para cálculos en el template
  getAverageGas(): string {
    if (this.records.length === 0) return '0.0';
    const sum = this.records.reduce((acc, record) => acc + record.gasValue, 0);
    return (sum / this.records.length).toFixed(1);
  }

  getAverageTemperature(): string {
    if (this.records.length === 0) return '0.0';
    const sum = this.records.reduce((acc, record) => acc + record.temperatureValue, 0);
    return (sum / this.records.length).toFixed(1);
  }

  getAverageHeartRate(): string {
    if (this.records.length === 0) return '0';
    const sum = this.records.reduce((acc, record) => acc + record.heartRateValue, 0);
    return (sum / this.records.length).toFixed(0);
  }

  isAllSensorsNormal(): boolean {
    if (this.records.length === 0) return false;
    return this.records.every(r => 
      r.gasValue < 50 && 
      r.temperatureValue >= 5 && 
      r.temperatureValue <= 35
    );
  }

  getQualityStatus(): string {
    return this.records.length > 0 && this.isAllSensorsNormal() 
      ? 'status-good' 
      : 'status-warning';
  }

  getQualityText(): string {
    return this.records.length > 0 && this.isAllSensorsNormal()
      ? 'Todos los valores dentro de rangos normales'
      : 'Algunos valores fuera de rango normal';
  }

  getGeneralRecommendation(): string {
    return this.incidents.length === 0 && this.records.length > 0 && this.isAllSensorsNormal()
      ? 'Delivery ejecutado sin problemas.'
      : 'Revisar incidentes y valores de sensores para futuras mejoras.';
  }

  getSensorIcon(source: string): string {
    switch (source) {
      case 'GAS':
        return 'warning';
      case 'TEMPERATURE':
        return 'thermostat';
      case 'HEART_RATE':
        return 'favorite';
      default:
        return 'sensors';
    }
  }

  getSensorUnit(source: string): string {
    switch (source) {
      case 'GAS':
        return 'ppm';
      case 'TEMPERATURE':
        return '°C';
      case 'HEART_RATE':
        return 'BPM';
      default:
        return '';
    }
  }

  getAutomaticIncidentStatus(): string {
    const criticalCount = this.automaticIncidents.filter(i => i.severity === 'CRITICAL').length;
    const highCount = this.automaticIncidents.filter(i => i.severity === 'HIGH').length;
    
    if (criticalCount > 0) return 'status-critical';
    if (highCount > 0) return 'status-danger';
    return 'status-warning';
  }

  getAutomaticIncidentSummary(): string {
    if (this.automaticIncidents.length === 0) return 'Sin incidentes de sensores detectados';
    
    const criticalCount = this.automaticIncidents.filter(i => i.severity === 'CRITICAL').length;
    const highCount = this.automaticIncidents.filter(i => i.severity === 'HIGH').length;
    const mediumCount = this.automaticIncidents.filter(i => i.severity === 'MEDIUM').length;
    const lowCount = this.automaticIncidents.filter(i => i.severity === 'LOW').length;
    
    let summary = `${this.automaticIncidents.length} incidente(s) de sensores: `;
    const parts = [];
    
    if (criticalCount > 0) parts.push(`${criticalCount} crítico(s)`);
    if (highCount > 0) parts.push(`${highCount} alto(s)`);
    if (mediumCount > 0) parts.push(`${mediumCount} medio(s)`);
    if (lowCount > 0) parts.push(`${lowCount} bajo(s)`);
    
    return summary + parts.join(', ');
  }
}
