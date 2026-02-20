import { User } from "./user";

export class UserAdminModel extends User {
	public createdAt: Date = new Date();
	constructor(
		surname = '',
		name = '',
		patronymic = '',
		email = '',
		createdAt = new Date()
	){
		super(surname, name, patronymic, email);
		this.createdAt = createdAt
	}

	override toString(): string {
		return `${super.toString()} ${this.createdAt}`;
	}
}
