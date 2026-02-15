import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-file-search',
	standalone: true,
	imports: [FormsModule],
	templateUrl: './file-search-component.html',
	styleUrls: ['./file-search-component.css']
})
export class FileSearchComponent {
	@Input() currentPath: string = '';
	searchQuery: string = '';

	constructor(private router: Router) {}

	onSearch(): void {
		if (!this.searchQuery.trim()) return;
		this.router.navigate(['/files', this.currentPath], {
			queryParams: { q: this.searchQuery, searchPath: this.currentPath }
		});
	}
}