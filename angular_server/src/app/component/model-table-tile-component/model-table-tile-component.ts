import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconManager } from '../icon-manager/icon-manager';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

import * as fileIcons from '@ng-icons/material-file-icons/colored';

@Component({
	selector: 'app-model-table-tile-component',
	imports: [CommonModule, NgIconComponent],
	providers: [provideIcons(fileIcons)],
	templateUrl: './model-table-tile-component.html',
	styleUrl: './model-table-tile-component.css',
})
export class ModelTableTileComponent {
	@Input() iconName: string | undefined;
	@Input() title: string = '';
}
