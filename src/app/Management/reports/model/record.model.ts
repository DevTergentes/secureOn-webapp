export class Record {
  id: number;
  sensorId: number;
  deliveryId: number;
  gasValue: number;
  temperatureValue: number;
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
    this.heartRateValue = 0;
    this.latitude = 0;
    this.longitude = 0;
    this.timestamp = '';
  }
}
