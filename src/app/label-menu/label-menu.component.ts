import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelNode } from '../shared/review-updates-api.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-label-menu',
    standalone: true,
    templateUrl: './label-menu.component.html',
    styleUrl: './label-menu.component.scss',
    imports: [MatMenuModule, MatButtonModule, CommonModule]
})
export class LabelMenuComponent {
    @Input() menuItems: LabelNode[] = [];
    @Output() labelSelected = new EventEmitter<any>();

    labelClicked(label: LabelNode) {
        console.log('Label clicked:', label);
        this.labelSelected.emit(label);
    }
}
