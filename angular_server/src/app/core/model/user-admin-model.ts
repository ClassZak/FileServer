import { User } from "./user";

export class UserAdminModel extends User {
	public createdAt: string = '';
	constructor(
		surname = '',
		name = '',
		patronymic = '',
		email = '',
		createdAt = ''
	){
		super(surname, name, patronymic, email);
		this.createdAt = createdAt
	}

	override toString(): string {
		return `${super.toString()} ${this.createdAt}`;
	}
}
