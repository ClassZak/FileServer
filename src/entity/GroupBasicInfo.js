/**
 * Model for group basic information (for lists)
 */
export class GroupBasicInfo {
	constructor(name, membersCount, creatorEmail) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creatorEmail = creatorEmail || '';
	}
}