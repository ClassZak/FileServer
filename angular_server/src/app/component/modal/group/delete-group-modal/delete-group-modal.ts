import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';

@Component({
	selector: 'app-delete-group-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent],
	templateUrl: './delete-group-modal.html',
	styleUrls: ['./delete-group-modal.css']
})
export class DeleteGroupModalComponent {
	@Input() isOpen: boolean = false;
	@Input() name: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	closeModal(): void {
		this.onClose.emit();
	}

	confirmDelete(): void {
		this.onConfirm.emit();
		this.closeModal();
	}
}