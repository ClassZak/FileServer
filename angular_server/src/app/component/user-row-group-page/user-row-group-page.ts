import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RedirectionButton } from '../redirection-button/redirection-button';
import { User } from '../../core/model/user';
import { UserAdminModel } from '../../core/model/user-admin-model';

@Component({
  selector: 'tr[app-user-row-group-page]',  // используем как атрибут тега <tr>
  imports: [CommonModule, RedirectionButton],
  templateUrl: './user-row-group-page.html',
  styleUrls: ['./user-row-group-page.css']
})
export class UserRowGroupPage {
  @Input() isAdmin: boolean = false;
  @Input() userData?: User | UserAdminModel;
  @Output() removeUser = new EventEmitter<string>(); // событие для удаления

  // Формируем ссылку на страницу пользователя
  public createNavigateToUserHref(email: string | undefined): string {
    return email ? `/user/${encodeURIComponent(email)}` : '/users';
  }

  // Обработчик клика по кнопке "Исключить"
  public onRemove(): void {
    if (this.userData?.email) {
      this.removeUser.emit(this.userData.email);
    }
  }
}