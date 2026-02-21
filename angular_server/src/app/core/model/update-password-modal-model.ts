export class UpdatePasswordModalModel {
	oldPassword: string;
	newPassword: string;
	newPasswordConfirm: string;
	constructor(
		oldPassword:string = '',
		newPassword:string = '',
		newPasswordConfirm: string = ''
	){
		this.oldPassword		 = oldPassword			 || '';
		this.newPassword		 = newPassword			 || '';
		this.newPasswordConfirm	 = newPasswordConfirm	 || '';
	}
	
	public clear(){
		this.oldPassword = this.newPassword = this.newPasswordConfirm = '';
	}

	public isConfirm(){
		return this.newPassword === this.newPasswordConfirm;
	}
}
