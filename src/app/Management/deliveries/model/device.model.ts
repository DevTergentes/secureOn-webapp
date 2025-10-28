export class Device {
  id: number;
  ownerId: number;
  safe: boolean;

  constructor() {
    this.id = 0;
    this.ownerId = 0;
    this.safe = false;
  }
}
