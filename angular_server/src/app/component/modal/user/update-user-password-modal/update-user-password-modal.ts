import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { UpdatePasswordModalModel } from '../../../../core/model/update-password-modal-model';


@Component({
	selector: 'app-update-user-password-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './update-user-password-modal.html',
	styleUrls: ['./update-user-password-modal.css']
})
export class UpdateUserPasswordModalComponent {
	@Input() isOpen: boolean = false;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<UpdatePasswordModalModel>();

	submitting: boolean = false;
	formData: UpdatePasswordModalModel = new UpdatePasswordModalModel();

	onInputChangeOldPassword(value: string): void {
		this.formData.oldPassword = value;
	}
	onInputChangeNewPassword(value: string): void {
		this.formData.newPassword = value;
	}
	onInputChangeNewPasswordConfirm(value: string): void {
		this.formData.newPasswordConfirm = value;
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;
		
		this.submitting = true;
		try {
			await this.onConfirm.emit(this.formData);
		} catch (error: any) {
			console.error(error);
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.formData.clear();
	}
}