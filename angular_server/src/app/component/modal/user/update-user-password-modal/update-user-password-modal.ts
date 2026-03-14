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
	error?: string;

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
			if (this.formData.newPassword != this.formData.newPasswordConfirm)
				throw Error('Ошибка. Новый пароль и подтверждение нового пароля не совпадают');
			this.onConfirm.emit(this.formData);
		} catch (error: any) {
			console.error(error);
			this.error = (error as Error).message;
			// TODO: notice
		} finally {
			this.submitting = false;
		}
	}

	/**
	 * Function for new password check
	 * @returns {boolean} false if invalid
	 * @throws {Error} 
	 */
	getNewPasswordMessage() : string | undefined {
		if (this.formData.newPassword != this.formData.newPasswordConfirm)
			return 'Ошибка. Новый пароль и подтверждение нового пароля не совпадают';
		// TODO: other errors

		return undefined;
	}

	closeModal(): void {
		this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.formData.clear();
	}
}