export class GroupUpdateModel {
	public newName:string;
	public creatorEmail: string;
	constructor (newName: string, creatorEmail: string){
		this.newName = newName;
		this.creatorEmail = creatorEmail;
	}
}
