import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';

@Component({
	selector: 'app-remove-user-from-group-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent],
	templateUrl: './remove-user-from-group-modal.html',
	styleUrls: ['./remove-user-from-group-modal.css']
})
export class RemoveUserFromGroupModalComponent {
	@Input() isOpen: boolean = false;
	@Input() groupName: string = '';
	@Input() user!: User | string; // can be full user object or just email
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	get userDisplay(): string {
		if (typeof this.user === 'string') {
			return this.user;
		}
		return `${this.user.surname} ${this.user.name} ${this.user.patronymic} (${this.user.email})`;
	}

	closeModal(): void {
		this.onClose.emit();
	}

	confirmRemove(): void {
		this.onConfirm.emit();
		this.closeModal();
	}
}