import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';

@Component({
	selector: 'app-delete-user-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent],
	templateUrl: './delete-user-modal.html',
	styleUrls: ['./delete-user-modal.css']
})
export class DeleteUserModalComponent {
	@Input() isOpen: boolean = false;
	@Input() email: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	closeModal(): void {
		this.onClose.emit();
	}

	confirmDelete(): void {
		this.onConfirm.emit();
		this.closeModal(); // usually closed after confirm
	}
}