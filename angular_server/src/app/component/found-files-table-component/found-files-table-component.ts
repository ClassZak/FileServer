import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FileInfo } from '../../core/model/file-info';
import { RedirectionButton } from '../redirection-button/redirection-button';

@Component({
	selector: 'app-found-files-table',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './found-files-table-component.html',
	styleUrls: ['./found-files-table-component.css']
})
export class FoundFilesTableComponent {
	@Input() files: FileInfo[] = [];
	@Input() searchPath: string = '';
	@Output() onDownload = new EventEmitter<{ path: string; name: string }>();
	@Output() onDelete = new EventEmitter<{ path: string; name: string }>();

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