export interface Record {
  id: number;
  sensorId: number;
  deliveryId: number;
  gasValue: number;
  heartRateValue: number;
  temperatureValue: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Sensor {
  id: number;
  ownerId: number;
  safe: boolean;
}

export interface AutomaticIncident {
  id: string; // Generado localmente
  type: 'AUTOMATIC' | 'MANUAL';
  source: 'GAS' | 'TEMPERATURE' | 'HEART_RATE';
  deliveryId: number;
  sensorId: number;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IncidentThresholds {
  gas: {
    warning: number;  // 40
    danger: number;   // 60
    critical: number; // 80
  };
  temperature: {
    minWarning: number;  // 5°C
    minDanger: number;   // 0°C
    maxWarning: number;  // 35°C
    maxDanger: number;   // 40°C
    maxCritical: number; // 45°C
  };
  heartRate: {
    minWarning: number;  // 50 BPM
    minDanger: number;   // 40 BPM
    maxWarning: number;  // 120 BPM
    maxDanger: number;   // 140 BPM
    maxCritical: number; // 160 BPM
  };
}