import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user'; // adjust path if needed


import { NoticeService } from '../../../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../../../core/view-core/model/notification';


export interface UpdateUserModel {
	surname: string;
	name: string;
	patronymic: string;
	email: string;
	password?: string; // optional for update
}

@Component({
	selector: 'app-update-user-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './update-user-modal.html',
	styleUrls: ['./update-user-modal.css']
})
export class UpdateUserModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() currentUser!: User;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<UpdateUserModel>();

	submitting = false;
	formData: UpdateUserModel = {
		surname: '',
		name: '',
		patronymic: '',
		email: '',
		password: ''
	};
	errors: { [key: string]: string | null } = {};

	constructor (
		private noticeService: NoticeService
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen'] && this.isOpen && this.currentUser) {
			// Pre-fill form when modal opens
			this.formData = {
				surname: this.currentUser.surname || '',
				name: this.currentUser.name || '',
				patronymic: this.currentUser.patronymic || '',
				email: this.currentUser.email || '',
				password: '' // do not pre-fill password
			};
			this.errors = {};
		}
	}

	validateForm(): boolean {
		const newErrors: typeof this.errors = {};

		if (!this.formData.surname.trim()) {
			newErrors['surname'] = 'Фамилия обязательна';
		}
		if (!this.formData.name.trim()) {
			newErrors['name'] = 'Имя обязательно';
		}
		if (!this.formData.patronymic.trim()) {
			newErrors['patronymic'] = 'Отчество обязательно';
		}
		if (!this.formData.email.trim()) {
			newErrors['email'] = 'Email обязателен';
		} else if (!/^\S+@\S+\.\S+$/.test(this.formData.email)) {
			newErrors['email'] = 'Введите корректный email';
		}
		// Password is optional on update; if provided, validate length
		if (this.formData.password && this.formData.password.length < 6) {
			newErrors['password'] = 'Пароль должен содержать минимум 6 символов';
		}

		this.errors = newErrors;
		Object.entries(this.errors).forEach(([field, message]) => {
			this.noticeService.addNotification(new Notification(NotificationType.Error, message?? 'Ошибка изменения пароля'));
		})
		
		return Object.keys(newErrors).length === 0;
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;
		if (!this.validateForm()) return;

		this.submitting = true;
		try {
			this.onConfirm.emit(this.formData);
		} catch (error) {
			console.error('Ошибка обновления пользователя:', error);
			this.noticeService.addNotification(new Notification(NotificationType.Error, (error as Error).message));
			this.errors['server'] = (error as Error).message || 'Ошибка обновления пользователя';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		//this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.formData = {
			surname: '',
			name: '',
			patronymic: '',
			email: '',
			password: ''
		};
		this.errors = {};
	}
}