import { Component, Input } from '@angular/core';
import { GroupBasicInfo } from '../../core/model/group_basic_info';

@Component({
	selector: 'app-group-table',
	imports: [],
	templateUrl: './group-table.html',
	styleUrl: './group-table.css',
})
export class GroupTable {
	@Input() groups?: Array<GroupBasicInfo>;
	
}
