export class Services {

  id: number;
  nameService: string;
  description: string;
  incidents: string;

  constructor() {
    this.id = 0;
    this.nameService = '';
    this.description = '';
    this.incidents = 'No One'; // Valor predeterminado según lo indicado
  }
}
