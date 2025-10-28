export class Sensor {
  id: number;
  sensorId: number;
  deliveryId: number;
  gasValue: number;
  temperatureValue: number;
  safe: boolean;
  unsafe: boolean;
  heartRateValue: number;
  latitude: number;
  longitude: number;
  timestamp: string;

  constructor() {
    this.id = 0;
    this.sensorId = 0;
    this.deliveryId = 0;
    this.gasValue = 0;
    this.temperatureValue = 0;
    this.safe = false;
    this.unsafe = false;
    this.heartRateValue = 0;
    this.latitude = 0;
    this.longitude = 0;
    this.timestamp = '';
  }
}
