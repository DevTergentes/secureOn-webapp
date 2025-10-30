import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Services} from '../../Management/services/model/services';
import {Delivery} from '../../Management/deliveries/model/delivery';
import {Incident} from '../../Incidents/model/incident';
import {Sensor} from '../../Management/monitoring/model/monitoring';


@Injectable({
  providedIn: 'root'
})

export class BaseService {
  private apiUrl = 'http://localhost:8080/api/secureon/v1';

  constructor(private http: HttpClient) {}

  // Configurar Headers (si es necesario, por ejemplo para autenticación)
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  // --- Métodos para Sensors ---
  getSensors(): Observable<Sensor[]> {
    console.log('Calling getSensors API'); // Log para verificar que se llama al metodo
    return this.http.get<Sensor[]>(`${this.apiUrl}/sensors`);
  }
  getSensorById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sensors/${id}`);
  }

  createSensor(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sensors`, data, this.httpOptions);
  }

  updateSensor(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sensors/${id}`, data, this.httpOptions);
  }

  deleteSensor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sensors/${id}`);
  }

  // --- Métodos para Incidents ---
  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/incidents`);
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/incidents/${id}`);
  }

  createIncident(data: any): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}/incidents`, data, this.httpOptions);
  }

  deleteIncident(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/incidents/${id}`);
  }

  // --- Métodos para Services ---
  getServices(): Observable<Services[]> {
    return this.http.get<Services[]>(`${this.apiUrl}/services`);
  }

  getServiceById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/services/${id}`);
  }

  createService(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/services`, data, this.httpOptions);
  }

  deleteService(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/services/${id}`);
  }

  // --- Métodos para Deliveries ---
  getDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}/deliveries`);
  }

  getDeliveryById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.apiUrl}/deliveries/${id}`);
  }

  getDeliveriesByUserId(userId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}/deliveries/${userId}`);
  }

  updateDeliveryStateInProgress(id: number, employeeId: any): Observable<Delivery> {
    return this.http.put<Delivery>(
      `${this.apiUrl}/deliveries/${id}/in-progress?employeeId=${employeeId}`,
      {} // cuerpo vacío
    );
  }

  updateDeliveryStateCompleted(id: number): Observable<Delivery> {
    return this.http.put<Delivery>(
      `${this.apiUrl}/deliveries/${id}/completed`,
      {} // cuerpo vacío
    );
  }

  createDelivery(data: any): Observable<Delivery> {
    return this.http.post<Delivery>(`${this.apiUrl}/deliveries`, data, this.httpOptions);
  }

  getLatestRecordByDeliveryId(deliveryId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/secureon/v1/records/delivery/${deliveryId}/latest`);
  }
  getRecordsByDeliveryId(deliveryId: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/records/delivery/${deliveryId}`);
  }

  getRecordsFromBeeceptor(): Observable<any[]> {
    return this.http.get<any[]>('https://secureon.free.beeceptor.com/api/v1/sensors-data');
  }

  deleteDelivery(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deliveries/${id}`);
  }

  getEmployeesByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/secureon/v1/employees/user/${userId}`);
  }
}
