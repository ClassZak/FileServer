import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FolderInfo } from '../../core/model/folder-info';
import { RedirectionButton } from '../redirection-button/redirection-button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

import * as fileIcons from '@ng-icons/material-file-icons/colored';
import { IconManager } from '../icon-manager/icon-manager';

@Component({
	selector: 'app-found-folders-table',
	standalone: true,
	imports: [CommonModule, RouterModule, RedirectionButton, NgIconComponent],
	providers: [provideIcons(fileIcons)],
	templateUrl: './found-folders-table-component.html',
	styleUrls: ['./found-folders-table-component.css']
})
export class FoundFoldersTableComponent {
	@Input() folders: FolderInfo[] = [];
	@Output() prepareDelete = new EventEmitter<{ path: string; name: string }>();

	deleteFolder(folder: FolderInfo): void {
		this.prepareDelete.emit({ path: folder.fullPath, name: folder.name });
	}

	getIcon(item: { isFolder: boolean; extension?: string }): string {
		if (item.isFolder) {
			// Используем централизованный IconManager для папки
			return IconManager.getFileIcon('folder');
		}
		return IconManager.getFileIcon(item.extension || '');
	}
}