import { User } from './user'; // ваш класс обычного пользователя
import { UserModelAdminResponse } from './user-model-admin-response';
import { GroupDetails } from './group-details';

// Успешный ответ для обычного пользователя
export interface GroupFullDetailsResponse {
		group: GroupDetails<User>;
}

// Успешный ответ для администратора
export interface GroupFullDetailsAdminResponse {
		group: GroupDetails<UserModelAdminResponse>;
}

// Контейнер для ошибки (возвращается при 403)
export interface ErrorContainer {
		error: string;
}