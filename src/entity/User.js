class User{
	constructor(
		surname,
		name,
		patronymic,
		email,
		password,
	){
		this.surname		= surname || '';
		this.name			= name || '';
		this.patronymic		= patronymic || '';
		this.email			= email || '';
		this.password		= password || '';
	}
}

export default User;