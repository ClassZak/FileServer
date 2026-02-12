import { Component, Input } from '@angular/core';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { RedirectionButton } from '../redirection-button/redirection-button';

@Component({
	selector: 'tr[app-group-row]',
	imports: [RedirectionButton],
	templateUrl: './group-row.html',
	styleUrl: './group-row.css',
})
export class GroupRow {
	@Input() isAdmin: boolean = false;
	@Input() groupData?: GroupBasicInfo;

	public createNavigateToGroupHref(name: string | undefined){
		if (name === undefined)
			return '/groups';
		return `/group/${encodeURIComponent(name)}`;
	};
}
