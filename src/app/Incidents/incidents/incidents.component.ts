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
    console.log('🔄 Iniciando carga de deliveries para usuario:', this.userRole, 'ID:', this.userId);
    
    if (this.isEmployee() && this.userId) {
      // Para empleados: usar la MISMA lógica que funciona en deliveries.component.ts
      console.log('📋 Cargando deliveries para empleado usando lógica de deliveries.component');
      this.loadDeliveriesForEmployee(this.userId);
    } else {
      // Para empresas: obtener todos los deliveries
      console.log('🏢 Cargando todos los deliveries para empresa');
      this.baseService.getDeliveries().subscribe({
        next: (deliveries: Delivery[]) => {
          console.log('✅ Deliveries obtenidos del backend:', deliveries);
          this.processDeliveries(deliveries);
        },
        error: (err) => {
          console.error('❌ Error al cargar deliveries:', err);
          this.loading = false;
        }
      });
    }
  }

  // Método para empleados que usa la misma lógica que deliveries.component.ts
  loadDeliveriesForEmployee(userId: number): void {
    console.log('🔍 Obteniendo employeeId para userId:', userId);
    
    this.baseService.getEmployeesByUserId(userId).subscribe({
      next: (employees: any[]) => {
        console.log('👥 Empleados encontrados:', employees);
        
        if (employees && employees.length > 0) {
          const employeeId = employees[0].id;
          console.log('🆔 EmployeeId obtenido:', employeeId);
          
          this.baseService.getDeliveries().subscribe({
            next: (data: Delivery[]) => {
              console.log('📦 Todos los deliveries:', data);
              
              // Aplicar el mismo filtro que en deliveries.component.ts
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
              this.processDeliveries(employeeDeliveries);
            },
            error: (error) => {
              console.error('❌ Error loading deliveries:', error);
              this.loading = false;
            }
          });
        } else {
          console.error('❌ No employee found for user id', userId);
          this.deliveriesWithIncidents = [];
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('❌ Error fetching employee by userId:', err);
        this.deliveriesWithIncidents = [];
        this.loading = false;
      }
    });
  }

  // Método para procesar los deliveries obtenidos
  private processDeliveries(deliveries: Delivery[]): void {
    if (!deliveries || deliveries.length === 0) {
      console.log('⚠️ No se encontraron deliveries');
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
      console.log('🎯 Deliveries con incidentes cargados:', this.deliveriesWithIncidents);
    }).catch(error => {
      console.error('❌ Error en Promise.all:', error);
      this.loading = false;
    });
  }

  private async loadIncidentsForDelivery(delivery: Delivery): Promise<any> {
    try {
      console.log(`🔍 Cargando datos para delivery ${delivery.id} - ${delivery.destination}`);
      
      // Obtener incidentes manuales del delivery
      let manualIncidents: any[] = [];
      try {
        manualIncidents = await this.incidentService.getIncidentsByDelivery(delivery.id).toPromise() || [];
        console.log(`📝 Incidentes manuales para delivery ${delivery.id}:`, manualIncidents);
      } catch (error) {
        console.log('⚠️ No se pudieron cargar incidentes manuales:', error);
      }
      
      // Para empleados: usar datos mock de sensores directamente sin depender de APIs externas
      let sensorRecords: any[] = [];
      let automaticIncidents: any[] = [];
      
      // Crear datos de sensores simulados pero realistas
      const mockSensorData = this.generateMockSensorData();
      sensorRecords = mockSensorData;
      
      // Detectar incidentes automáticos basados en los datos mock
      automaticIncidents = this.incidentService.detectAutomaticIncidents(sensorRecords);
      
      console.log(`📊 Datos de sensores simulados para delivery ${delivery.id}:`, sensorRecords);
      console.log(`🚨 Incidentes automáticos detectados:`, automaticIncidents);

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

      console.log(`✅ Datos cargados para delivery ${delivery.id}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Error al cargar incidentes para delivery ${delivery.id}:`, error);
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

  // Generar datos de sensores mock realistas
  private generateMockSensorData(): any[] {
    const now = new Date();
    const records = [];
    
    // Generar 10 registros de las últimas 2 horas
    for (let i = 9; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 12 * 60 * 1000)); // Cada 12 minutos
      
      records.push({
        id: i + 1,
        deviceId: 'HR-2947',
        gasValue: Math.floor(Math.random() * 100) + 10, // 10-110 ppm
        temperatureValue: Math.floor(Math.random() * 50) + 10, // 10-60°C
        heartRateValue: Math.floor(Math.random() * 100) + 60, // 60-160 BPM
        timestamp: timestamp.toISOString(),
        deliveryId: 1,
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
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

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
