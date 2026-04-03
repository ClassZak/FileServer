import { User } from "./user";

export class UserAdminModel extends User {
	public createdAt: Date = new Date();
	constructor (
		surname = '',
		name = '',
		patronymic = '',
		email = '',
		createdAt = new Date(),
	) {
		super(surname, name, patronymic, email);
		this.createdAt = createdAt;
	}

	override toString(): string{
		return `${super.toString()} ${UserAdminModel.DATE_FORMATTER.format(this.createdAt).replace(',', '')}`;
	}

	private static DATE_FORMATTER	= new Intl.DateTimeFormat(
		'ru-Ru', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}
	);
}