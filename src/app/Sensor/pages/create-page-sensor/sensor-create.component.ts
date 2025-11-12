import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sensor-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensor-create.component.html',
  styleUrls: ['./sensor-create.component.css'],
})
export class SensorCreateComponent {
  deviceName: string = '';
  showForm: boolean = false;
  error: string = '';
  success: string = '';
  createdDevice: string = '';

  constructor(private http: HttpClient) {}

  onAddDeviceClick() {
    this.showForm = true;
    this.deviceName = '';
    this.error = '';
    this.success = '';
    this.createdDevice = '';
  }

  async addSensor() {
    this.error = '';
    this.success = '';
    // Leer usuario desde localStorage
    const userString = localStorage.getItem('user');
    if (!userString) {
      this.error = 'No user found in local storage';
      return;
    }
    const user = JSON.parse(userString);
    const userId = user.id;

    try {
      // Consulta employee asociado al user
      const employees = await this.http.get<any[]>(
        `https://secureon-backend-production.up.railway.app/api/secureon/v1/employees/user/${userId}`
      ).toPromise() ?? [];

      if (!employees || employees.length === 0) {
        this.error = 'No employee found for this user.';
        return;
      }
      const ownerId = employees[0].id;

      // Crear sensor (POST)
      const body = { ownerId, safe: true };
      await this.http.post<any>(
        'https://secureon-backend-production.up.railway.app/api/secureon/v1/sensors',
        body
      ).toPromise();

      this.success = '¡Sensor agregado exitosamente!';
      this.createdDevice = this.deviceName;
      this.showForm = false;
    } catch (err: any) {
      this.error = err?.error?.message || 'Error al agregar sensor.';
    }
  }
}
