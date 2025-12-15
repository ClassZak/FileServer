class UserModelAdminResponse{
	constructor(
		surname,
		name,
		patronymic,
		email,
		createdAt,
	){
		this.surname		= surname || '';
		this.name			= name || '';
		this.patronymic		= patronymic || '';
		this.email			= email || '';
		this.createdAt		= createdAt || '';
	}
}

export default UserModelAdminResponse;