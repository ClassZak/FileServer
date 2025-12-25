import User from "./User";

/**
 * Model for detailed group information (for group page)
 */
export class GroupDetails {
	constructor(name, membersCount, creator, members = []) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creator = creator || new User();
		this.members = members || [];
	}
}