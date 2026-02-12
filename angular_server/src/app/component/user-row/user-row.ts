import { Component, Input } from '@angular/core';
import { UserAdminModel } from '../../core/model/user-admin-model';
import { User } from '../../core/model/user';
import { RedirectionButton } from '../redirection-button/redirection-button';

@Component({
	selector: 'tr[app-user-row]',
	imports: [RedirectionButton],
	templateUrl: './user-row.html',
	styleUrl: './user-row.css',
})
export class UserRow {
	@Input() isAdmin: boolean = false;
	@Input() userData?: User | UserAdminModel;

	public createNavigateToUserHref(name: string | undefined){
		if (name === undefined)
			return '/users';
		return `/user/${encodeURIComponent(name)}`;
	};
}
