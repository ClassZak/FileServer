import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';

export interface GroupCreateModel {
	name: string;
	creatorEmail: string;
}

@Component({
	selector: 'app-create-group-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './create-group-modal.html',
	styleUrls: ['./create-group-modal.css']
})
export class CreateGroupModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() users: User[] = [];
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<GroupCreateModel>();

	submitting = false;
	formData: GroupCreateModel = {
		name: '',
		creatorEmail: ''
	};
	searchQuery = '';
	filteredUsers: User[] = [];
	errors: { [key: string]: string | null } = {};

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen'] && !this.isOpen) {
			this.resetForm();
		}
		if (changes['users']) {
			this.filterUsers();
		}
	}

	onSearchChange(): void {
		this.filterUsers();
	}

	filterUsers(): void {
		if (!this.searchQuery.trim()) {
			this.filteredUsers = this.users;
		} else {
			const query = this.searchQuery.toLowerCase();
			this.filteredUsers = this.users.filter(user =>
				user.email.toLowerCase().includes(query) ||
				(user.surname && user.surname.toLowerCase().includes(query)) ||
				(user.name && user.name.toLowerCase().includes(query)) ||
				(user.patronymic && user.patronymic.toLowerCase().includes(query))
			);
		}
	}

	selectCreator(email: string): void {
		this.formData.creatorEmail = email;
		this.searchQuery = '';
		this.filteredUsers = [];
		delete this.errors['creatorEmail'];
	}

	clearCreator(): void {
		this.formData.creatorEmail = '';
		this.searchQuery = '';
	}

	validateForm(): boolean {
		const newErrors: typeof this.errors = {};

		if (!this.formData.name.trim()) {
			newErrors['name'] = 'Название группы обязательно';
		} else if (this.formData.name.length < 3) {
			newErrors['name'] = 'Название должно содержать минимум 3 символа';
		} else if (this.formData.name.length > 64) {
			newErrors['name'] = 'Название не должно превышать 64 символа';
		}

		if (!this.formData.creatorEmail) {
			newErrors['creatorEmail'] = 'Выберите создателя группы';
		} else if (!this.users.some(u => u.email === this.formData.creatorEmail)) {
			newErrors['creatorEmail'] = 'Выбранный пользователь не найден';
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
			this.resetForm();
		} catch (error: any) {
			console.error('Ошибка создания группы:', error);
			this.errors['server'] = error.message || 'Ошибка создания группы';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.formData = { name: '', creatorEmail: '' };
		this.searchQuery = '';
		this.filteredUsers = [];
		this.errors = {};
	}

	get selectedCreator(): User | undefined {
		return this.users.find(u => u.email === this.formData.creatorEmail);
	}
}