import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo } from '../../core/model/file-info';
import { IconManager } from '../icon-manager/icon-manager';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

import * as fileIcons from '@ng-icons/material-file-icons/colored';

@Component({
	selector: 'app-file-table',
	standalone: true,
	imports: [CommonModule, NgIconComponent],
	// Регистрируем сразу весь набор иконок
	providers: [provideIcons(fileIcons)],
	templateUrl: './file-table-component.html',
	styleUrls: ['./file-table-component.css']
})
export class FileTableComponent {
	@Input() files: FileInfo[] = [];
	@Output() onDownload = new EventEmitter<{ path: string; name: string }>();
	@Output() onDelete = new EventEmitter<{ path: string; name: string }>();

	getIcon(item: { isFolder: boolean; extension?: string }): string {
		if (item.isFolder) {
			// Используем централизованный IconManager для папки
			return IconManager.getFileIcon('folder');
		}
		return IconManager.getFileIcon(item.extension || '');
	}

	downloadFile(file: FileInfo): void {
		this.onDownload.emit({ path: file.fullPath, name: file.name });
	}

	deleteFile(file: FileInfo): void {
		this.onDelete.emit({ path: file.fullPath, name: file.name });
	}
}