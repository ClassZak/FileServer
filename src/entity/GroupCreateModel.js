/**
 * Model for group creation
 */
export class GroupCreateModel{
	constructor(name = '', creatorEmail = '') {
		this.name = name;
		this.creatorEmail = creatorEmail;
	}
}