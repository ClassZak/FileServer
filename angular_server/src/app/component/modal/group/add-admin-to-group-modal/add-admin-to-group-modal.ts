import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';


interface Group {
	name: string;
	membersCount?: number;
	creatorEmail?: string;
}

@Component({
	selector: 'app-add-admin-to-group-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, ModalComponent],
	templateUrl: './add-admin-to-group-modal.html',
	styleUrls: ['./add-admin-to-group-modal.css']
})
export class AddAdminToGroupModalComponent implements OnChanges {
	@Input() isOpen: boolean = false;
	@Input() groups: Group[] = [];               // список всех групп
	@Input() currentUserEmail: string = '';       // email текущего администратора
	@Output() onClose = new EventEmitter<void>();
	@Output() onConfirm = new EventEmitter<string>(); // передаёт название выбранной группы

	submitting = false;
	selectedGroupName = '';
	searchQuery = '';
	filteredGroups: Group[] = [];
	errors: { group?: string | null; server?: string | null } = {};

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isOpen'] && !this.isOpen) {
			this.resetForm();
		}
		if (changes['groups']) {
			this.filterGroups();
		}
	}

	onSearchChange(): void {
		this.filterGroups();
	}

	filterGroups(): void {
		if (!this.searchQuery.trim()) {
			this.filteredGroups = this.groups;
		} else {
			const query = this.searchQuery.toLowerCase();
			this.filteredGroups = this.groups.filter(group =>
				group.name.toLowerCase().includes(query)
			);
		}
	}

	selectGroup(groupName: string): void {
		this.selectedGroupName = groupName;
		this.searchQuery = '';
		this.filteredGroups = [];
		delete this.errors['group'];
	}

	clearSelection(): void {
		this.selectedGroupName = '';
		this.searchQuery = '';
	}

	validateForm(): boolean {
		if (!this.selectedGroupName) {
			this.errors['group'] = 'Выберите группу';
			return false;
		}
		return true;
	}

	async submitForm(): Promise<void> {
		if (this.submitting) return;
		if (!this.validateForm()) return;

		this.submitting = true;
		try {
			await this.onConfirm.emit(this.selectedGroupName);
			this.closeModal();
			this.resetForm();
		} catch (error: any) {
			console.error('Ошибка добавления администратора:', error);
			this.errors['server'] = error.message || 'Ошибка добавления администратора';
		} finally {
			this.submitting = false;
		}
	}

	closeModal(): void {
		this.onClose.emit();
	}

	resetForm(): void {
		this.selectedGroupName = '';
		this.searchQuery = '';
		this.filteredGroups = [];
		this.errors = {};
	}

	get selectedGroup(): Group | undefined {
		if (!this.groups || this.groups.length === 0) return undefined;
		return this.groups.find(g => g.name === this.selectedGroupName);
	}
}