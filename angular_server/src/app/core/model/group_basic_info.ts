/**
 * Model for group basic information (for lists)
 */
export class GroupBasicInfo {
	public name: string;
	public membersCount: number;
	public creatorEmail: string;
	
	constructor(name: string, membersCount: number, creatorEmail: string) {
		this.name = name || '';
		this.membersCount = membersCount || 0;
		this.creatorEmail = creatorEmail || '';
	}
}