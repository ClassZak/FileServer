import { User } from './user';
import { UserAdminModel } from './user-admin-model';
import { GroupDetails } from './group-details';

// Default user succes response
export interface GroupFullDetailsResponse {
	group: GroupDetails<User>;
}

// Admin succes response
export interface GroupFullDetailsAdminResponse {
	group: GroupDetails<UserAdminModel>;
}
