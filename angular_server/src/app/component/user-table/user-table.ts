import { Component, Input } from '@angular/core';
import { UserRow } from '../user-row/user-row';
import { User } from '../../core/model/user';
import { UserAdminModel } from '../../core/model/user-admin-model';

@Component({
	selector: 'app-user-table',
	imports: [UserRow],
	templateUrl: './user-table.html',
	styleUrl: './user-table.css',
})
export class UserTable {
	@Input() isAdmin: boolean = false;
	@Input() users?: Array<User> | Array<UserAdminModel>
}
