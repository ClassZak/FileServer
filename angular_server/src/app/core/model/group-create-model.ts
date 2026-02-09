/**
 * Model for group creation
 */
export class GroupCreateModel {
	public name: string;
	public creatorEmail: string;
	
	constructor(name = '', creatorEmail = '') {
		this.name = name;
		this.creatorEmail = creatorEmail;
	}
}