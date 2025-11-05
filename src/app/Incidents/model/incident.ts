
export class Incident {
  id: number;
  incidentPlace: string;
  date: string | any; // Puede ser string o array [year, month, day]
  description: string;
  serviceId: number;

  constructor() {
    this.id = 0;
    this.incidentPlace = '';
    this.date = '';
    this.description = '';
    this.serviceId = 0;
  }
}
