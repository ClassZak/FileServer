import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-delete-group-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent, FormsModule],
	templateUrl: './delete-group-modal.html',
	styleUrls: ['./delete-group-modal.css']
})
export class DeleteGroupModalComponent {
	@Input() isOpen: boolean = false;
	@Input() name: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();
	submitting: boolean = false;

	constructor(
		private cdr: ChangeDetectorRef
	) {}

	closeModal(): void {
		this.onClose.emit();
	}

	confirmDelete(): void {
		this.onConfirm.emit();
		this.closeModal();
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;

		this.submitting = true;
		try {
			this.onConfirm.emit();
		} catch (error) {
			console.error('Ошибка удаления группы:', error);
		} finally {
			this.submitting = false;
			this.cdr.detectChanges();
		}
	}
}