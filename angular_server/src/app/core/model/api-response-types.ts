import { User } from './user'; // ваш класс обычного пользователя
import { UserAdminModel } from './user-admin-model';
import { GroupDetails } from './group-details';

// Успешный ответ для обычного пользователя
export interface GroupFullDetailsResponse {
	group: GroupDetails<User>;
}

// Успешный ответ для администратора
export interface GroupFullDetailsAdminResponse {
	group: GroupDetails<UserAdminModel>;
}
