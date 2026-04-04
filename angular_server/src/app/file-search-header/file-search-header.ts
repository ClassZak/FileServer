import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-file-search-header',
	imports: [CommonModule, FormsModule],
	templateUrl: './file-search-header.html',
	styleUrl: './file-search-header.css',
})
export class FileSearchHeader {
	public isSearching: boolean = false;
	public searchQuery: string = '';

	constructor (
		private router: Router
	){}
	
	handleSearch(): void {
		this.isSearching = true;
		try {
			const query = this.searchQuery.trim();
			if (!query) {
				return; // Nothing to do if is empty
			}
			
			// Go to root
			this.router.navigate(['/files'], {
				queryParams: {
					q: query,
					searchPath: '' // Search in root
				}
			});
		} catch (error) {
			// TODO: notice
		} finally {
			this.isSearching = false;
		}
	}
}
