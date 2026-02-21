import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FileInfo } from '../../core/model/file-info';
import { RedirectionButton } from '../redirection-button/redirection-button';
import { IconManager } from '../icon-manager/icon-manager';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import * as fileIcons from '@ng-icons/material-file-icons/colored';

@Component({
	selector: 'app-found-files-table',
	standalone: true,
	imports: [CommonModule, RouterModule, NgIconComponent],
	providers: [provideIcons(fileIcons)],
	templateUrl: './found-files-table-component.html',
	styleUrls: ['./found-files-table-component.css']
})
export class FoundFilesTableComponent {
	@Input() files: FileInfo[] = [];
	@Input() searchPath: string = '';
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

	getRelativePath(file: FileInfo): string {
		if (this.searchPath && file.fullPath.startsWith(this.searchPath)) {
			return file.fullPath.substring(this.searchPath.length).replace(/^\//, '');
		}
		return file.fullPath;
	}
}