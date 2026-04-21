import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';
import { User } from '../../../../core/model/user';
import { UserAdminModel } from '../../../../core/model/user-admin-model';
import { GroupDetails } from '../../../../core/model/group-details';
import { GroupUpdateModel } from '../../../../core/model/group-update-model';


import { NoticeService } from '../../../../core/view-core/service/notice-service';
import { Notification, NotificationType } from '../../../../core/view-core/model/notification';


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
	@Input() currentGroup!: GroupDetails<UserAdminModel>;
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<GroupUpdateModel>();

	submitting = false;
	formData: GroupUpdateModel = new GroupUpdateModel('', '');
	searchQuery = '';
	filteredUsers: User[] = [];
	errors: { [key: string]: string | null } = {};

	constructor(
		private noticeService: NoticeService
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen'] && this.isOpen && this.currentGroup) {
			this.formData = {
				newName: this.currentGroup.name || '',
				creatorEmail: this.currentGroup.creator.email || ''
			};
			this.errors = {};
			this.searchQuery = '';
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
		Object.entries(this.errors).forEach(([field, message])=>{
			this.noticeService.addNotification(new Notification(NotificationType.Error, message?? 'Ошибка обновления группы'));
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
			console.error('Ошибка обновления группы:', error);
			this.errors['server'] = (error as Error).message || 'Ошибка обновления группы';
			this.noticeService.addNotification(new Notification(NotificationType.Error, this.errors['server']));
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
		this.errors = {};
	}

	get selectedCreator(): User | undefined {
		return this.users.find(u => u.email === this.formData.creatorEmail);
	}
}