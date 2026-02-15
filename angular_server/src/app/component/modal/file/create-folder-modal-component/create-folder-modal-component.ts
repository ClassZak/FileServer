import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-create-folder-modal',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './create-folder-modal-component.html',
	styleUrls: ['./create-folder-modal-component.css']
})
export class CreateFolderModalComponent {
	@Input() isOpen: boolean = false;
	@Input() currentPath: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onCreate = new EventEmitter<string>();

	folderName: string = '';

	close(): void {
		this.onClose.emit();
		this.folderName = '';
	}

	create(): void {
		if (!this.folderName.trim()) return;
		this.onCreate.emit(this.folderName.trim());
		this.folderName = '';
	}
}