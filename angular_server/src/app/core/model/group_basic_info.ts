/**
 * Model for group basic information (for lists)
 */
export class GroupBasicInfo {
	public name: string;
	public membersCount: number;
	public headEmail: string;
	
	constructor(name: string, membersCount: number, headEmail: string) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.headEmail = headEmail || '';
	}
}