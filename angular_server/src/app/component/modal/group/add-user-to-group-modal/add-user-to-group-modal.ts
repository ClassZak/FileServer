import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';

@Component({
	selector: 'app-add-user-to-group-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './add-user-to-group-modal.html',
	styleUrls: ['./add-user-to-group-modal.css']
})
export class AddUserToGroupModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() users: User[] = [];
	@Input() groupName: string = '';
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<string>(); // emits selected user email

	submitting = false;
	selectedUserEmail = '';
	searchQuery = '';
	filteredUsers: User[] = [];
	errors: { userEmail?: string | null; server?: string | null } = {};

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

	selectUser(userEmail: string): void {
		this.selectedUserEmail = userEmail;
		this.searchQuery = '';
		this.filteredUsers = [];
		delete this.errors['userEmail'];
	}

	clearSelection(): void {
		this.selectedUserEmail = '';
		this.searchQuery = '';
	}

	validateForm(): boolean {
		if (!this.selectedUserEmail) {
			this.errors['userEmail'] = 'Выберите пользователя';
			return false;
		}
		return true;
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;
		if (!this.validateForm()) return;

		this.submitting = true;
		try {
			await this.onConfirm.emit(this.selectedUserEmail);
			this.resetForm();
		} catch (error: any) {
			console.error('Ошибка добавления пользователя:', error);
			this.errors['server'] = error.message || 'Ошибка добавления пользователя';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.resetForm();
		this.onClose.emit();
	}

	resetForm(): void {
		this.selectedUserEmail = '';
		this.searchQuery = '';
		this.filteredUsers = [];
		this.errors = {};
	}

	get selectedUser(): User | undefined {
		return this.users.find(u => u.email === this.selectedUserEmail);
	}
}