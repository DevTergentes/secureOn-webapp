import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incident } from '../model/incident';
import { 
  Record as SensorRecord, 
  Sensor as SensorDevice, 
  AutomaticIncident, 
  IncidentThresholds 
} from '../model/sensor-records';

export interface CreateIncidentRequest {
  id?: number;
  incidentPlace: string;
  date: string;
  description: string;
  serviceId: number;
}

export interface Service {
  id: number;
  nameService: string;
  description: string;
  ownerId: number;
  deliveryId: number;
}

export interface Sensor {
  id: number;
  ownerId: number;
  safe: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private API_URL = 'http://localhost:8080/api/secureon/v1';

  // Umbrales para detectar incidentes automáticos
  private thresholds: IncidentThresholds = {
    gas: {
      warning: 40,
      danger: 60,
      critical: 80
    },
    temperature: {
      minWarning: 5,
      minDanger: 0,
      maxWarning: 35,
      maxDanger: 40,
      maxCritical: 45
    },
    heartRate: {
      minWarning: 50,
      minDanger: 40,
      maxWarning: 120,
      maxDanger: 140,
      maxCritical: 160
    }
  };

  constructor(private http: HttpClient) {}

  // Obtener todos los incidentes
  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.API_URL}/incidents`);
  }

  // Crear nuevo incidente
  createIncident(incident: CreateIncidentRequest): Observable<Incident> {
    return this.http.post<Incident>(`${this.API_URL}/incidents`, incident);
  }

  // Obtener incidentes por delivery
  getIncidentsByDelivery(deliveryId: number): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.API_URL}/incidents/delivery/${deliveryId}`);
  }

  // Obtener todos los servicios
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.API_URL}/services`);
  }

  // Crear nuevo servicio
  createService(service: Service): Observable<Service> {
    return this.http.post<Service>(`${this.API_URL}/services`, service);
  }

  // Eliminar servicio
  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/services/${id}`);
  }

  // Obtener deliveries por empleado
  getDeliveriesByEmployee(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/deliveries/employee/${employeeId}`);
  }

  // === MÉTODOS PARA SENSORES Y RECORDS ===

  // Obtener sensores por delivery
  getSensorsByDelivery(deliveryId: number): Observable<SensorDevice[]> {
    return this.http.get<SensorDevice[]>(`${this.API_URL}/sensors/delivery/${deliveryId}`);
  }

  // Obtener todos los records de un delivery
  getRecordsByDelivery(deliveryId: number): Observable<SensorRecord[]> {
    return this.http.get<SensorRecord[]>(`${this.API_URL}/records/delivery/${deliveryId}`);
  }

  // Obtener el último record de un delivery
  getLatestRecordByDelivery(deliveryId: number): Observable<SensorRecord> {
    return this.http.get<SensorRecord>(`${this.API_URL}/records/delivery/${deliveryId}/latest`);
  }

  // === LÓGICA DE DETECCIÓN DE INCIDENTES AUTOMÁTICOS ===

  // Analizar records y detectar incidentes automáticos
  detectAutomaticIncidents(records: SensorRecord[]): AutomaticIncident[] {
    const incidents: AutomaticIncident[] = [];

    records.forEach(record => {
      // Verificar gas
      const gasIncident = this.checkGasLevels(record);
      if (gasIncident) incidents.push(gasIncident);

      // Verificar temperatura
      const tempIncident = this.checkTemperature(record);
      if (tempIncident) incidents.push(tempIncident);

      // Verificar ritmo cardíaco
      const heartRateIncident = this.checkHeartRate(record);
      if (heartRateIncident) incidents.push(heartRateIncident);
    });

    return incidents;
  }

  private checkGasLevels(record: SensorRecord): AutomaticIncident | null {
    const { gasValue } = record;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null = null;
    let message = '';

    if (gasValue >= this.thresholds.gas.critical) {
      severity = 'CRITICAL';
      message = `Nivel de gas CRÍTICO: ${gasValue} ppm (Umbral: ${this.thresholds.gas.critical})`;
    } else if (gasValue >= this.thresholds.gas.danger) {
      severity = 'HIGH';
      message = `Nivel de gas PELIGROSO: ${gasValue} ppm (Umbral: ${this.thresholds.gas.danger})`;
    } else if (gasValue >= this.thresholds.gas.warning) {
      severity = 'MEDIUM';
      message = `Nivel de gas elevado: ${gasValue} ppm (Umbral: ${this.thresholds.gas.warning})`;
    }

    if (severity) {
      return {
        id: `gas_${record.id}_${Date.now()}`,
        type: 'AUTOMATIC',
        source: 'GAS',
        deliveryId: record.deliveryId,
        sensorId: record.sensorId,
        value: gasValue,
        threshold: severity === 'CRITICAL' ? this.thresholds.gas.critical : 
                  severity === 'HIGH' ? this.thresholds.gas.danger : this.thresholds.gas.warning,
        message,
        timestamp: record.timestamp,
        severity
      };
    }
    return null;
  }

  private checkTemperature(record: SensorRecord): AutomaticIncident | null {
    const { temperatureValue } = record;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null = null;
    let message = '';

    if (temperatureValue >= this.thresholds.temperature.maxCritical) {
      severity = 'CRITICAL';
      message = `Temperatura CRÍTICA: ${temperatureValue}°C (Umbral: ${this.thresholds.temperature.maxCritical}°C)`;
    } else if (temperatureValue >= this.thresholds.temperature.maxDanger) {
      severity = 'HIGH';
      message = `Temperatura PELIGROSA: ${temperatureValue}°C (Umbral: ${this.thresholds.temperature.maxDanger}°C)`;
    } else if (temperatureValue >= this.thresholds.temperature.maxWarning) {
      severity = 'MEDIUM';
      message = `Temperatura elevada: ${temperatureValue}°C (Umbral: ${this.thresholds.temperature.maxWarning}°C)`;
    } else if (temperatureValue <= this.thresholds.temperature.minDanger) {
      severity = 'HIGH';
      message = `Temperatura PELIGROSAMENTE baja: ${temperatureValue}°C (Umbral: ${this.thresholds.temperature.minDanger}°C)`;
    } else if (temperatureValue <= this.thresholds.temperature.minWarning) {
      severity = 'MEDIUM';
      message = `Temperatura baja: ${temperatureValue}°C (Umbral: ${this.thresholds.temperature.minWarning}°C)`;
    }

    if (severity) {
      return {
        id: `temp_${record.id}_${Date.now()}`,
        type: 'AUTOMATIC',
        source: 'TEMPERATURE',
        deliveryId: record.deliveryId,
        sensorId: record.sensorId,
        value: temperatureValue,
        threshold: temperatureValue >= this.thresholds.temperature.maxWarning ? 
                  this.thresholds.temperature.maxWarning : this.thresholds.temperature.minWarning,
        message,
        timestamp: record.timestamp,
        severity
      };
    }
    return null;
  }

  private checkHeartRate(record: SensorRecord): AutomaticIncident | null {
    const { heartRateValue } = record;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null = null;
    let message = '';

    if (heartRateValue >= this.thresholds.heartRate.maxCritical) {
      severity = 'CRITICAL';
      message = `Ritmo cardíaco CRÍTICO: ${heartRateValue} BPM (Umbral: ${this.thresholds.heartRate.maxCritical} BPM)`;
    } else if (heartRateValue >= this.thresholds.heartRate.maxDanger) {
      severity = 'HIGH';
      message = `Ritmo cardíaco PELIGROSO: ${heartRateValue} BPM (Umbral: ${this.thresholds.heartRate.maxDanger} BPM)`;
    } else if (heartRateValue >= this.thresholds.heartRate.maxWarning) {
      severity = 'MEDIUM';
      message = `Ritmo cardíaco elevado: ${heartRateValue} BPM (Umbral: ${this.thresholds.heartRate.maxWarning} BPM)`;
    } else if (heartRateValue <= this.thresholds.heartRate.minDanger) {
      severity = 'HIGH';
      message = `Ritmo cardíaco PELIGROSAMENTE bajo: ${heartRateValue} BPM (Umbral: ${this.thresholds.heartRate.minDanger} BPM)`;
    } else if (heartRateValue <= this.thresholds.heartRate.minWarning) {
      severity = 'MEDIUM';
      message = `Ritmo cardíaco bajo: ${heartRateValue} BPM (Umbral: ${this.thresholds.heartRate.minWarning} BPM)`;
    }

    if (severity) {
      return {
        id: `hr_${record.id}_${Date.now()}`,
        type: 'AUTOMATIC',
        source: 'HEART_RATE',
        deliveryId: record.deliveryId,
        sensorId: record.sensorId,
        value: heartRateValue,
        threshold: heartRateValue >= this.thresholds.heartRate.maxWarning ? 
                  this.thresholds.heartRate.maxWarning : this.thresholds.heartRate.minWarning,
        message,
        timestamp: record.timestamp,
        severity
      };
    }
    return null;
  }
}