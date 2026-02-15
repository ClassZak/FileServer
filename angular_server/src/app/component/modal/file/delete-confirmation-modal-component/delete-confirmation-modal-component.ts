import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-delete-confirmation-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './delete-confirmation-modal-component.html',
	styleUrls: ['./delete-confirmation-modal-component.css']
})
export class DeleteConfirmationModalComponent {
	@Input() isOpen: boolean = false;
	@Input() itemName: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	close(): void {
		this.onClose.emit();
	}

	confirm(): void {
		this.onConfirm.emit();
	}
}