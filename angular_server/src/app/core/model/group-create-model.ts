/**
 * Model for group creation
 */
export class GroupCreateModel {
	public name: string;
	public headEmail: string;
	
	constructor(name = '', headEmail = '') {
		this.name = name;
		this.headEmail = headEmail;
	}
}