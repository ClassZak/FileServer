import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from "../../modal/modal";

@Component({
	selector: 'app-delete-confirmation-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent],
	templateUrl: './delete-confirmation-modal-component.html',
	styleUrls: ['./delete-confirmation-modal-component.css']
})
export class DeleteConfirmationModalComponent {
	@Input() isOpen: boolean = false;
	@Input() itemName: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	closeModal(): void {
		this.onClose.emit();
	}

	confirmModal(): void {
		this.onConfirm.emit();
		this.closeModal();
	}
}