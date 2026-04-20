import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NoticeService } from '../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../core/view-core/model/notification';

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
		private router: Router,


		private noticeService: NoticeService
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
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
		} finally {
			this.isSearching = false;
		}
	}
}
