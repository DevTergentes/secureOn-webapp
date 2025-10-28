
export class Incident {
  id: number;
  incidentPlace: string;
  date: string;
  description: string;

  constructor() {
    this.id = 0;
    this.incidentPlace = '';
    this.date = '';
    this.description = '';
  }
}
