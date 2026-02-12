import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';

export interface CreateUserModel {
	surname: string;
	name: string;
	patronymic: string;
	email: string;
	password: string;
}

@Component({
	selector: 'app-create-user-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './create-user-modal.html',
	styleUrls: ['./create-user-modal.css']
})
export class CreateUserModalComponent {
	@Input() isOpen: boolean = false;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<CreateUserModel>();

	submitting = false;
	formData: CreateUserModel = {
		surname: '',
		name: '',
		patronymic: '',
		email: '',
		password: ''
	};
	errors: { [key: string]: string | null } = {};

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
		if (!this.formData.password) {
			newErrors['password'] = 'Пароль обязателен';
		} else if (this.formData.password.length < 6) {
			newErrors['password'] = 'Пароль должен содержать минимум 6 символов';
		}

		this.errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;
		if (!this.validateForm()) return;

		this.submitting = true;
		try {
			await this.onConfirm.emit(this.formData);
		} catch (error: any) {
			console.error('Ошибка создания пользователя:', error);
			this.errors['server'] = error.message || 'Ошибка создания пользователя';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.resetForm();
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