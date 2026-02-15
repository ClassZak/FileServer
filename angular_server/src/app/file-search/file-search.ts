import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-file-search',
	imports: [CommonModule, FormsModule],
	templateUrl: './file-search.html',
	styleUrl: './file-search.css',
})
export class FileSearch {
	public isSearching: boolean = false;
	public searchQuery: string = '';

	constructor (
		private router: Router
	){}
	
	handleSearch(): void {
		const query = this.searchQuery.trim();
		if (!query) {
			return; // ничего не делаем при пустом запросе
		}

		// Переход в корень с параметрами поиска
		this.router.navigate(['/files'], {
			queryParams: {
				q: query,
				searchPath: '' // поиск от корня
			}
		});
	}
}
