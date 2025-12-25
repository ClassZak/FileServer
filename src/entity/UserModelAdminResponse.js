class UserModelAdminResponse{
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

export default UserModelAdminResponse;