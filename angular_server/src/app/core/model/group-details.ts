import { User } from "./user";

/**
 * Model for detailed group information (for group page)
 */
export class GroupDetails {
	name: string;
	membersCount: number;
	creator: User;
	members: Array<User>;
	constructor(name:string, membersCount:number, creator: User, members = []) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creator = creator || new User();
		this.members = members || [];
	}
}
