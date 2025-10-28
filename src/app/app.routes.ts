import { Routes } from '@angular/router';
import {IncidentsComponent} from './Incidents/incidents/incidents.component';
import {ServicesComponent} from './Management/services/services.component';
import {ComponentsComponent} from './Profiles/components/components.component';
import {DeliveriesComponent} from './Management/deliveries/components/deliveries/deliveries.component';
import {DeliveryDetailsComponent} from './Management/deliveries/components/delivery-details/delivery-details.component';
import {LoginComponent} from './Auth/login/login.component';
import {SignupComponent} from './Auth/signup/signup.component';
import {
  AddDeliveryPageComponent
} from './Management/deliveries/components/add-delivery-dialog/add-delivery-page.component';
import {AddIncidentPageComponent} from './Incidents/components/add-new-incident/add-incident-page.component';
import {AddNewServiceComponent} from './Management/services/components/add-new-service/add-new-service.component';
import {ReportComponent} from './Management/reports/components/report/report.component';
import {SensorCreateComponent} from './Sensor/pages/create-page-sensor/sensor-create.component';

export const routes: Routes = [
  { path: 'services', component: ServicesComponent },
  { path: 'incidents', component: IncidentsComponent },
  { path: 'employees', component: ComponentsComponent },
  { path: 'sensors/create', component: SensorCreateComponent },

  { path: 'deliveries', component: DeliveriesComponent },
  { path: 'delivery-details/:id', component: DeliveryDetailsComponent },
  { path: 'delivery-report/:id', component: ReportComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'deliveries/add', component: AddDeliveryPageComponent },
  { path: 'add-incident', component: AddIncidentPageComponent },
  { path: 'add-service', component: AddNewServiceComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // Ruta por defecto
];
