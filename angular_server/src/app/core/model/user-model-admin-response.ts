export class UserModelAdminResponse{
	surname:string = '';
	name:string = '';
	patronymic:string = '';
	email:string = '';
	createdAt:string = '';
	constructor(
		surname = '',
		name = '',
		patronymic = '',
		email = '',
		createdAt = '',
	){
		this.surname		= surname;
		this.name			= name;
		this.patronymic		= patronymic;
		this.email			= email;
		this.createdAt		= createdAt;
	}

	toString(){
		return `${this.surname} ${this.name} ${this.patronymic} ${this.email}`;
	}
}
