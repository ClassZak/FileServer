import { Component, Input } from '@angular/core';
import { GroupBasicInfo } from '../../core/model/group_basic_info';
import { RedirectionButton } from '../redirection-button/redirection-button';
import { GroupRow } from '../group-row/group-row';

@Component({
	selector: 'app-group-table',
	imports: [GroupRow],
	templateUrl: './group-table.html',
	styleUrl: './group-table.css',
})
export class GroupTable {
	@Input() isAdmin: boolean = false;
	@Input() groups?: Array<GroupBasicInfo>;
}
