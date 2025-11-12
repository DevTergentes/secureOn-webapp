import {Component, OnInit} from '@angular/core';
import { CommonModule }      from '@angular/common';
import { MatCardModule }     from '@angular/material/card';
import { MatIconModule }     from '@angular/material/icon';
import { MatInputModule }    from '@angular/material/input';
import {Incident} from '../model/incident';
import {BaseService} from '../../shared/services/base.service';
import {MatIconButton, MatFabButton} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Auth/services/auth.service';
import { IncidentService } from '../services/incident.service';
import { Delivery } from '../../Management/deliveries/model/delivery';
import { 
  Record as SensorRecord, 
  Sensor as SensorDevice, 
  AutomaticIncident 
} from '../model/sensor-records';
import { forkJoin } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

@Component({
    selector: 'app-incidents',
    imports: [
        CommonModule, //  ← soluciona NG8103
        MatCardModule, //  ← <mat-card>
        MatIconModule, //  ← <mat-icon>
        MatInputModule, //  ← matInput
        MatIconButton,
        MatFabButton,
        MatExpansionModule,
        MatChipsModule,
        FormsModule
    ],
    templateUrl: './incidents.component.html',
    styleUrls: ['./incidents.component.css']
})
export class IncidentsComponent implements OnInit {
  deliveriesWithIncidents: any[] = []; // Array que contendrá deliveries con sus incidentes
  searchText: string = '';
  userRole: string | null = null;
  userId: number | null = null;
  loading = false;

  constructor(
    private baseService: BaseService,
    private incidentService: IncidentService,
    private authService: AuthService,
    private router: Router
  ) {
    // Obtener información del usuario desde localStorage
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.userRole = user.role;
      this.userId = user.id;
    }
  }

  ngOnInit(): void {
    this.loadDeliveriesWithIncidents();
  }

  loadDeliveriesWithIncidents(): void {
    this.loading = true;
    
    if (this.isEmployee() && this.userId) {
      // Para empleados: usar la MISMA lógica que funciona en deliveries.component.ts
      this.loadDeliveriesForEmployee(this.userId);
    } else {
      // Para empresas: obtener todos los deliveries (solo los aceptados o en progreso)
      this.baseService.getDeliveries().subscribe({
        next: (deliveries: Delivery[]) => {
          // Filtrar solo deliveries que están aceptados o en progreso
          const acceptedDeliveries = deliveries.filter(delivery => 
            delivery.state === 'ACCEPTED' || 
            delivery.state === 'IN_PROGRESS' ||
            delivery.state === 'COMPLETED'
          );
          console.log('Total deliveries:', deliveries.length, 'Filtered (accepted/in_progress/completed):', acceptedDeliveries.length);
          this.processDeliveries(acceptedDeliveries);
        },
        error: (err) => {
          console.error('Error loading deliveries:', err);
          this.loading = false;
        }
      });
    }
  }

  // Método para empleados que usa la misma lógica que deliveries.component.ts
  loadDeliveriesForEmployee(userId: number): void {
    this.baseService.getEmployeesByUserId(userId).subscribe({
      next: (employees: any[]) => {
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          
          this.baseService.getDeliveries().subscribe({
            next: (data: Delivery[]) => {
              // Solo mostrar deliveries que ya han sido aceptados por el empleado
              const employeeDeliveries = Array.isArray(data)
                ? data.filter(delivery =>
                    delivery.employeeId === employeeId &&
                    (delivery.state === 'IN_PROGRESS' || delivery.state === 'COMPLETED')
                  )
                : [];
              
              console.log('Employee deliveries (only IN_PROGRESS/COMPLETED):', employeeDeliveries.length);
              
              this.processDeliveries(employeeDeliveries);
            },
            error: (error) => {
              this.loading = false;
            }
          });
        } else {
          this.deliveriesWithIncidents = [];
          this.loading = false;
        }
      },
      error: (err) => {
        this.deliveriesWithIncidents = [];
        this.loading = false;
      }
    });
  }

  // Método para procesar los deliveries obtenidos
  private processDeliveries(deliveries: Delivery[]): void {
    if (!deliveries || deliveries.length === 0) {
      this.deliveriesWithIncidents = [];
      this.loading = false;
      return;
    }
    
    // Para cada delivery, obtener incidentes y datos de sensores
    const deliveryPromises = deliveries.map(delivery => 
      this.loadIncidentsForDelivery(delivery)
    );

    Promise.all(deliveryPromises).then(results => {
      this.deliveriesWithIncidents = results.filter(result => result !== null);
      this.loading = false;
    }).catch(error => {
      this.loading = false;
    });
  }

  private async loadIncidentsForDelivery(delivery: Delivery): Promise<any> {
    try {
      // Obtener incidentes manuales del delivery
      let manualIncidents: any[] = [];
      try {
        manualIncidents = await this.incidentService.getIncidentsByDelivery(delivery.id).toPromise() || [];
        console.log(`Loaded ${manualIncidents.length} manual incidents for delivery ${delivery.id}`);
      } catch (error: any) {
        console.warn(`No incidents found for delivery ${delivery.id}:`, error.status);
        // Si es 404, simplemente no hay incidentes para este delivery (es normal)
        manualIncidents = [];
      }
      
      // Usar datos reales de sensores desde el endpoint específico del delivery
      let sensorRecords: any[] = [];
      let automaticIncidents: any[] = [];
      
      try {
        // Cargar datos reales de sensores desde la API de Railway para este delivery específico
        sensorRecords = await this.baseService.getRecordsByDeliveryId(delivery.id.toString()).toPromise() || [];
        console.log(`Loaded ${sensorRecords.length} sensor records from Railway for delivery ${delivery.id}`);
        
        // Detectar incidentes automáticos basados en los datos reales de sensores
        if (sensorRecords.length > 0) {
          automaticIncidents = this.incidentService.detectAutomaticIncidents(sensorRecords);
          console.log(`Detected ${automaticIncidents.length} automatic incidents for delivery ${delivery.id}`);
        }
      } catch (error: any) {
        console.warn(`Error loading sensor data from Railway for delivery ${delivery.id}:`, error);
        // Si hay error con la API, usar datos mock como fallback
        const mockSensorData = this.generateMockSensorData(delivery.id);
        sensorRecords = mockSensorData;
        automaticIncidents = this.incidentService.detectAutomaticIncidents(sensorRecords);
        console.log(`Using fallback mock data: ${automaticIncidents.length} automatic incidents detected`);
      }

      // Crear información de sensores simplificada
      const sensors = [{
        id: 1,
        safe: automaticIncidents.length === 0,
        deliveryId: delivery.id
      }];

      const result = {
        delivery,
        manualIncidents,
        automaticIncidents,
        sensors,
        latestRecords: sensorRecords?.slice(-5) || [], // Últimos 5 records
        totalIncidents: manualIncidents.length + automaticIncidents.length
      };

      return result;
      
    } catch (error) {
      console.error(`Error loading incidents for delivery ${delivery.id}:`, error);
      return {
        delivery,
        manualIncidents: [],
        automaticIncidents: [],
        sensors: [],
        latestRecords: [],
        totalIncidents: 0
      };
    }
  }

  // Generar datos de sensores mock realistas y consistentes
  private generateMockSensorData(deliveryId: number): any[] {
    const now = new Date();
    const records = [];
    
    // Usar el deliveryId como semilla para generar valores consistentes
    const seed = deliveryId;
    
    // Generar 10 registros de las últimas 2 horas
    for (let i = 9; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 12 * 60 * 1000)); // Cada 12 minutos
      
      // Generar valores consistentes basados en deliveryId y el índice
      const gasValue = ((seed * 17 + i * 7) % 100) + 10; // 10-110 ppm
      const temperatureValue = ((seed * 13 + i * 5) % 50) + 10; // 10-60°C
      const heartRateValue = ((seed * 11 + i * 3) % 100) + 60; // 60-160 BPM
      
      records.push({
        id: i + 1,
        deviceId: 'HR-2947',
        gasValue: gasValue,
        temperatureValue: temperatureValue,
        heartRateValue: heartRateValue,
        timestamp: timestamp.toISOString(),
        deliveryId: deliveryId,
        sensorId: 1
      });
    }
    
    return records;
  }

  filterIncidents(): void {
    // Filtrar por texto de búsqueda en el destino del delivery
    if (!this.searchText.trim()) {
      this.loadDeliveriesWithIncidents();
      return;
    }

    const filtered = this.deliveriesWithIncidents.filter(item =>
      item.delivery.destination.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.delivery.packageDescription.toLowerCase().includes(this.searchText.toLowerCase())
    );
    
    this.deliveriesWithIncidents = filtered;
  }

  // Verificar si el usuario es empleado
  isEmployee(): boolean {
    return this.userRole === 'EMPLOYEE';
  }

  // Navegar a agregar incidente
  addIncident(): void {
    this.router.navigate(['/add-incident']);
  }

  // Obtener clase CSS según la severidad del incidente automático
  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'severity-critical';
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      case 'LOW': return 'severity-low';
      default: return 'severity-low';
    }
  }

  // Obtener icono según el tipo de sensor
  getSensorIcon(source: string): string {
    switch (source) {
      case 'GAS': return 'warning';
      case 'TEMPERATURE': return 'thermostat';
      case 'HEART_RATE': return 'favorite';
      default: return 'sensors';
    }
  }

  // Formatear fecha
  formatDate(dateString: string | Date | null): string {
    if (!dateString) {
      return 'Fecha no disponible';
    }

    let date: Date;

    // Manejar diferentes tipos de entrada
    if (dateString instanceof Date) {
      date = dateString;
    } else if (Array.isArray(dateString)) {
      // Si es un array, usar los elementos como [año, mes, día, hora, minuto, segundo]
      if (dateString.length >= 3) {
        const year = dateString[0];
        const month = dateString[1] - 1; // Los meses en JavaScript van de 0-11
        const day = dateString[2];
        const hour = dateString[3] || 0;
        const minute = dateString[4] || 0;
        const second = dateString[5] || 0;
        
        date = new Date(year, month, day, hour, minute, second);
      } else {
        return `Fecha inválida (array corto): ${JSON.stringify(dateString)}`;
      }
    } else if (typeof dateString === 'string') {
      // Intentar diferentes formatos de fecha
      
      // Formato ISO con Z o timezone
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString);
      }
      // Formato con comas: "2025,11,11,0,0" o similar
      else if (dateString.includes(',')) {
        const parts = dateString.split(',').map(part => parseInt(part.trim()));
        
        if (parts.length >= 3 && parts.every(part => !isNaN(part))) {
          // Formato: año, mes, día, [hora], [minuto], [segundo]
          const year = parts[0];
          const month = parts[1] - 1; // Los meses en JavaScript van de 0-11
          const day = parts[2];
          const hour = parts[3] || 0;
          const minute = parts[4] || 0;
          const second = parts[5] || 0;
          
          date = new Date(year, month, day, hour, minute, second);
        } else {
          return `Fecha inválida (comas): ${dateString}`;
        }
      }
      // Formato yyyy-mm-dd
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T00:00:00');
      }
      // Formato dd/mm/yyyy o mm/dd/yyyy
      else if (dateString.includes('/')) {
        date = new Date(dateString);
      }
      // Formato dd-mm-yyyy
      else if (dateString.includes('-') && dateString.length === 10) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Asumir yyyy-mm-dd
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(dateString);
        }
      }
      // Timestamp numérico como string
      else if (/^\d+$/.test(dateString)) {
        const timestamp = parseInt(dateString);
        // Si es timestamp en segundos (10 dígitos), convertir a milisegundos
        date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      }
      // Otros formatos
      else {
        date = new Date(dateString);
      }
    } else {
      // Si es un número (timestamp)
      const timestamp = Number(dateString);
      date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return `Fecha inválida: ${dateString}`;
    }
    
    // Validar que la fecha esté en un rango razonable (años 2020-2030)
    const year = date.getFullYear();
    if (year < 2020 || year > 2030) {
      return `Fecha fuera de rango: ${dateString}`;
    }
    
    try {
      // Formatear solo fecha con zona horaria de Lima
      const formattedDate = date.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      return formattedDate;
    } catch (error) {
      return date.toLocaleDateString(); // Fallback simple
    }
  }

  // Formatear solo fecha (sin hora)
  formatDateOnly(dateString: string | Date | null): string {
    if (!dateString) {
      return 'Fecha no disponible';
    }

    let date: Date;

    // Usar la misma lógica de formatDate para parsing
    if (dateString instanceof Date) {
      date = dateString;
    } else if (Array.isArray(dateString)) {
      // Si es un array, usar los elementos como [año, mes, día, hora, minuto, segundo]
      if (dateString.length >= 3) {
        const year = dateString[0];
        const month = dateString[1] - 1; // Los meses en JavaScript van de 0-11
        const day = dateString[2];
        const hour = dateString[3] || 0;
        const minute = dateString[4] || 0;
        const second = dateString[5] || 0;
        
        date = new Date(year, month, day, hour, minute, second);
      } else {
        return `Fecha inválida (array corto): ${JSON.stringify(dateString)}`;
      }
    } else if (typeof dateString === 'string') {
      // Intentar diferentes formatos de fecha
      if (dateString.includes('T') || dateString.includes('Z')) {
        date = new Date(dateString);
      }
      // Formato con comas: "2025,11,11,0,0" o similar
      else if (dateString.includes(',')) {
        const parts = dateString.split(',').map(part => parseInt(part.trim()));
        
        if (parts.length >= 3 && parts.every(part => !isNaN(part))) {
          // Formato: año, mes, día, [hora], [minuto], [segundo]
          const year = parts[0];
          const month = parts[1] - 1; // Los meses en JavaScript van de 0-11
          const day = parts[2];
          const hour = parts[3] || 0;
          const minute = parts[4] || 0;
          const second = parts[5] || 0;
          
          date = new Date(year, month, day, hour, minute, second);
        } else {
          return `Fecha inválida (comas): ${dateString}`;
        }
      }
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T00:00:00');
      }
      else if (dateString.includes('/')) {
        date = new Date(dateString);
      }
      else if (dateString.includes('-') && dateString.length === 10) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(dateString);
        }
      }
      else if (/^\d+$/.test(dateString)) {
        const timestamp = parseInt(dateString);
        date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      }
      else {
        date = new Date(dateString);
      }
    } else {
      const timestamp = Number(dateString);
      date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return `Fecha inválida: ${dateString}`;
    }
    
    // Validar que la fecha esté en un rango razonable (años 2020-2030)
    const year = date.getFullYear();
    if (year < 2020 || year > 2030) {
      return `Fecha fuera de rango: ${dateString}`;
    }
    
    // Formatear solo fecha con zona horaria de Lima
    return date.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Métodos para obtener estado y clase CSS de los valores de sensores
  getGasStatus(value: number): string {
    if (value >= 80) return 'CRÍTICO';
    if (value >= 60) return 'PELIGRO';
    if (value >= 40) return 'ADVERTENCIA';
    return 'NORMAL';
  }

  getGasStatusClass(value: number): string {
    if (value >= 80) return 'status-critical';
    if (value >= 60) return 'status-danger';
    if (value >= 40) return 'status-warning';
    return 'status-normal';
  }

  getTemperatureStatus(value: number): string {
    if (value >= 45) return 'CRÍTICO';
    if (value >= 40 || value <= 0) return 'PELIGRO';
    if (value >= 35 || value <= 5) return 'ADVERTENCIA';
    return 'NORMAL';
  }

  getTemperatureStatusClass(value: number): string {
    if (value >= 45) return 'status-critical';
    if (value >= 40 || value <= 0) return 'status-danger';
    if (value >= 35 || value <= 5) return 'status-warning';
    return 'status-normal';
  }

  getHeartRateStatus(value: number): string {
    if (value >= 160) return 'CRÍTICO';
    if (value >= 140 || value <= 40) return 'PELIGRO';
    if (value >= 120 || value <= 50) return 'ADVERTENCIA';
    return 'NORMAL';
  }

  getHeartRateStatusClass(value: number): string {
    if (value >= 160) return 'status-critical';
    if (value >= 140 || value <= 40) return 'status-danger';
    if (value >= 120 || value <= 50) return 'status-warning';
    return 'status-normal';
  }
}
