// src/app/shared/footer/footer/footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-footer', // 👈 añade esta línea
    imports: [
        CommonModule,
        MatDividerModule,
    ],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent {}
