// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';
import { FooterComponent } from './shared/footer/footer/footer.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToolbarComponent, FooterComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'secureon-webapp';
}
