import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../modal/modal';

interface User {
  email: string;
  surname: string;
  name: string;
  patronymic: string;
}

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
  @Output() onConfirm = new EventEmitter<string>();

  submitting: boolean = false;
  selectedUserEmail: string = '';
  errors: any = {};
  filteredUsers: User[] = [];
  searchQuery: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users'] || changes['searchQuery']) {
      this.filterUsers();
    }
    
    if (changes['isOpen'] && !changes['isOpen'].currentValue) {
      this.resetForm();
    }
  }

  filterUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.surname.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.patronymic.toLowerCase().includes(query)
      );
    }
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  selectUser(userEmail: string): void {
    this.selectedUserEmail = userEmail;
    this.searchQuery = '';
    
    if (this.errors['userEmail']) {
      delete this.errors['userEmail'];
    }
  }

  clearSelection(): void {
    this.selectedUserEmail = '';
  }

  validateForm(): boolean {
    const errors: any = {};
    
    if (!this.selectedUserEmail.trim()) {
      errors['userEmail'] = 'Выберите пользователя';
    }
    
    this.errors = errors;
    return Object.keys(errors).length === 0;
  }

  async submitForm(): Promise<void> {
    if (this.submitting) return;
    
    if (!this.validateForm()) {
      return;
    }
    
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
    this.errors = {};
    this.searchQuery = '';
    this.filteredUsers = [...this.users];
  }

  get selectedUser(): User | undefined {
    return this.users.find(user => user.email === this.selectedUserEmail);
  }
}