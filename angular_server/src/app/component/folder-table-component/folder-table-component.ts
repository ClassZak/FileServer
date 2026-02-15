import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FolderInfo } from '../../core/model/folder-info';
import { RedirectionButton } from '../redirection-button/redirection-button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

import * as fileIcons from '@ng-icons/material-file-icons/colored';
import { IconManager } from '../icon-manager/icon-manager';

@Component({
	selector: 'app-folder-table',
	standalone: true,
	imports: [CommonModule, RouterModule, RedirectionButton, NgIconComponent],
	providers: [provideIcons(fileIcons)],
	templateUrl: './folder-table-component.html',
	styleUrls: ['./folder-table-component.css']
})
export class FolderTableComponent {
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