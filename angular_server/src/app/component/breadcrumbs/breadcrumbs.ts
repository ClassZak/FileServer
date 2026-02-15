// breadcrumbs.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-breadcrumbs',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './breadcrumbs.html',
	styleUrls: ['./breadcrumbs.css']
})
export class BreadcrumbsComponent implements OnChanges {
	@Input() currentPath: string = '';
	@Output() navigate = new EventEmitter<string>();
	@Output() navigateUp = new EventEmitter<void>();

	parts: string[] = [];

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['currentPath']) {
			this.parts = this.currentPath.split('/').filter(part => part.length > 0);
		}
	}

	// Build the accumulated path up to a given index
	getPathTo(index: number): string {
		return this.parts.slice(0, index + 1).join('/');
	}
}