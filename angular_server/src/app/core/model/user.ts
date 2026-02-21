export class User {
	public surname:		string;
	public name:		string;
	public patronymic:	string;
	public email:		string;

	constructor(
		surname = '',
		name = '',
		patronymic = '',
		email = ''
	){
		this.surname		= surname;
		this.name			= name;
		this.patronymic		= patronymic;
		this.email			= email;
	}

	toString(){
		return `${this.surname} ${this.name} ${this.patronymic} ${this.email}`;
	}
}
