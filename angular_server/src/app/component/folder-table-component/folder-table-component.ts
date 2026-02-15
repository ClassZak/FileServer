import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FolderInfo } from '../../core/model/folder-info';
import { RedirectionButton } from '../redirection-button/redirection-button';

@Component({
	selector: 'app-folder-table',
	standalone: true,
	imports: [CommonModule, RouterModule, RedirectionButton],
	templateUrl: './folder-table-component.html',
	styleUrls: ['./folder-table-component.css']
})
export class FolderTableComponent {
	@Input() folders: FolderInfo[] = [];
	@Output() prepareDelete = new EventEmitter<{ path: string; name: string }>();

	deleteFolder(folder: FolderInfo): void {
		this.prepareDelete.emit({ path: folder.fullPath, name: folder.name });
	}
}