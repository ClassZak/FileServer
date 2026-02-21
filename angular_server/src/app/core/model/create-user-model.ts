import { User } from "./user";

export class CreateUserModel extends User {
	public password: string = '';
	constructor(surname = '',
		name = '',
		patronymic = '',
		email = '',
		password = ''
	) {
		super(surname, name, patronymic, email);
		this.password = password;
	}
}
