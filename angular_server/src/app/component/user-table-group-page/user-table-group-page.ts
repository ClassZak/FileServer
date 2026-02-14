import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRowGroupPage } from '../user-row-group-page/user-row-group-page';
import { User } from '../../core/model/user';
import { UserAdminModel } from '../../core/model/user-admin-model';

@Component({
  selector: 'app-user-table-group-page',
  imports: [CommonModule, UserRowGroupPage],
  templateUrl: './user-table-group-page.html',
  styleUrls: ['./user-table-group-page.css']
})
export class UserTableGroupPage {
  @Input() isAdmin: boolean = false;
  @Input() users?: Array<User> | Array<UserAdminModel>;
  @Output() removeUser = new EventEmitter<string>(); // пробрасываем событие из строки

  // Обработчик события из дочерней строки
  onRemoveUser(email: string): void {
    this.removeUser.emit(email);
  }
}