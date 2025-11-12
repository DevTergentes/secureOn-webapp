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

export class BaseSensorService {
  private apiUrl = 'https://secureon-backend-production.up.railway.app/api/secureon/v1';

  constructor(private http: HttpClient) {}

  // Configurar Headers (si es necesario, por ejemplo para autenticación)
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  // --- Métodos para Sensors ---
  getSensors(): Observable<Sensor[]> {
    console.log('Calling getSensors API'); // Log para verificar que se llama al método
    return this.http.get<Sensor[]>(`${this.apiUrl}/sensors`);
  }
  getSensorById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sensors/${id}`);
  }

  getSensorByDeliveryId(deliveryId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sensors/delivery/${deliveryId}`);
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

  // --- Métodos para Records ---
  getRecordsByDeliveryId(id : string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/records/delivery/${id}`);
  }


}
