import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { FormsModule } from "@angular/forms";

@Component({
	selector: 'app-create-folder-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent, FormsModule],
	templateUrl: './create-folder-modal-component.html',
	styleUrls: ['./create-folder-modal-component.css']
})
export class CreateFolderModalComponent {
	@Input() isOpen: boolean = false;
	@Input() currentPath: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<string>();

	folderName: string = '';

	closeModal(): void {
		this.onClose.emit();
	}

	confirmModal(): void {
		this.onConfirm.emit(this.folderName);
		this.closeModal();
	}
}