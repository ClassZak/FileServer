import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-remove-user-from-group-modal',
	standalone: true,
	imports: [CommonModule, ModalComponent, FormsModule],
	templateUrl: './remove-user-from-group-modal.html',
	styleUrls: ['./remove-user-from-group-modal.css']
})
export class RemoveUserFromGroupModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() groupName: string = '';
	@Input() user!: User | string;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<void>();

	userDisplay: string = '';

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['user']) {
			this.updateUserDisplay();
		}
	}

	private updateUserDisplay(): void {
		if (typeof this.user === 'string')
			this.userDisplay = this.user;
		else if (this.user)
			this.userDisplay = `${this.user.surname} ${this.user.name} ${this.user.patronymic} (${this.user.email})`;
		else
			this.userDisplay = '';
	}

	closeModal(): void {
		this.onClose.emit();
	}

	confirmRemove(): void {
		this.onConfirm.emit();
		this.closeModal();
	}
}