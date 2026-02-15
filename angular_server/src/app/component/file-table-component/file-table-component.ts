import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo } from '../../core/model/file-info'; // проверьте путь

@Component({
	selector: 'app-file-table',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './file-table-component.html',
	styleUrls: ['./file-table-component.css']
})
export class FileTableComponent {
	@Input() files: FileInfo[] = [];
	@Output() onDownload = new EventEmitter<{ path: string; name: string }>();
	@Output() onDelete = new EventEmitter<{ path: string; name: string }>();

	downloadFile(file: FileInfo): void {
		this.onDownload.emit({ path: file.fullPath, name: file.name });
	}

	deleteFile(file: FileInfo): void {
		this.onDelete.emit({ path: file.fullPath, name: file.name });
	}
}