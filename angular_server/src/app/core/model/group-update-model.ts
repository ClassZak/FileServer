export class GroupUpdateModel {
	public newName:string;
	public headEmail: string;
	constructor (newName: string, headEmail: string){
		this.newName = newName;
		this.headEmail = headEmail;
	}
}
