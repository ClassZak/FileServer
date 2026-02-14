import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';
import { UserModelAdminResponse } from '../../../../core/model/user-model-admin-response';
import { GroupDetails } from '../../../../core/model/group-details';

export interface UpdateGroupModel {
	newName: string;
	creatorEmail: string;
}

@Component({
	selector: 'app-update-group-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './update-group-modal.html',
	styleUrls: ['./update-group-modal.css']
})
export class UpdateGroupModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() users: User[] = [];
	@Input() currentGroup!: GroupDetails<UserModelAdminResponse>;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<UpdateGroupModel>();

	submitting = false;
	formData: UpdateGroupModel = {
		newName: '',
		creatorEmail: ''
	};
	searchQuery = '';
	filteredUsers: User[] = [];
	showUsersList = false;
	errors: { [key: string]: string | null } = {};

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen'] && this.isOpen && this.currentGroup) {
			this.formData = {
				newName: this.currentGroup.name || '',
				creatorEmail: this.currentGroup.creator.email || ''
			};
			this.errors = {};
			this.searchQuery = '';
			this.showUsersList = false;
		}
		if (changes['isOpen'] && !this.isOpen) {
			this.resetForm();
		}
		if (changes['users']) {
			this.filterUsers();
		}
	}

	onSearchChange(): void {
		this.filterUsers();
		this.showUsersList = true;
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
		this.showUsersList = false;
		delete this.errors['creatorEmail'];
	}

	clearSelection(): void {
		this.formData.creatorEmail = '';
		this.searchQuery = '';
		this.showUsersList = true;
	}

	validateForm(): boolean {
		const newErrors: typeof this.errors = {};

		if (!this.formData.newName.trim()) {
			newErrors['newName'] = 'Название группы обязательно';
		} else if (this.formData.newName.length < 3) {
			newErrors['newName'] = 'Название должно содержать минимум 3 символа';
		} else if (this.formData.newName.length > 64) {
			newErrors['newName'] = 'Название не должно превышать 64 символа';
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
		} catch (error:any) {
			console.error('Ошибка обновления группы:', error);
			this.errors['server'] = error.message || 'Ошибка обновления группы';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.formData = { newName: '', creatorEmail: '' };
		this.searchQuery = '';
		this.filteredUsers = [];
		this.showUsersList = false;
		this.errors = {};
	}

	get selectedCreator(): User | undefined {
		return this.users.find(u => u.email === this.formData.creatorEmail);
	}
}