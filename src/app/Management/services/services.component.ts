import {Component, OnInit} from '@angular/core';
import {Services} from './model/services';
import {BaseService} from '../../shared/services/base.service';
import {MatCard} from '@angular/material/card';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-services',
    templateUrl: './services.component.html',
    imports: [
        MatCard,
        NgClass,
        NgForOf,
        NgIf,
        MatIconButton,
        MatInput,
        ReactiveFormsModule,
        FormsModule
    ],
    styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  services: Services[] = [];
  filteredServices: Services[] = [];
  searchText: string = '';

  constructor(private baseService: BaseService, private router: Router) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.baseService.getServices().subscribe(data => {
      this.services = data;
      this.filteredServices = data;
      console.log('Servicios:', this.services);
    });
  }

  filterServices(): void {
    this.filteredServices = this.services.filter((incident) =>
      incident.nameService.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  navigateToAddService(): void {
    this.router.navigate(['/add-service']); // Cambia la ruta según tu configuración
  }

}
