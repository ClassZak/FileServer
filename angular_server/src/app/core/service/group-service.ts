import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { GroupDetails } from '../model/group-details';
import { UserAdminModel } from '../model/user-admin-model';
import { GroupBasicInfo } from '../model/group_basic_info';
import { GroupCreateModel } from '../model/group-create-model';
import { GroupUpdateModel } from '../model/group-update-model';
import { CreateConfig } from './create-config';
import { DefaultServiceResult, DefaultServiceResultWithData } from '../model/default-server-result';
import { GroupFullDetailsAdminResponse, GroupFullDetailsResponse } from '../model/api-response-types';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export class CheckMembershipResult {
	isMember: boolean = false;
	groupExists: boolean = false;
}
export class CheckGroupAccessResult {
	constructor(
		public hasAccess: boolean = false,
		public groupName: string = ''
	) {};
}



/**
 * Imterface for GET /api/groups/my requests
 */
interface ApiGroupsMyServerResponse {
	groups: Array<GroupBasicInfo>
}

/**
 * Imterface for GET /api/groups requests
 */
interface ApiGroupsServerResponse {
	groups: Array<GroupBasicInfo>;
}

/**
 * Imterface for GET /api/groups/name/${encodeURIComponent(groupName)}/check-access requests
 */
interface ApiGroupsNameGroupNameCheckAccessServerResponse {
	hasAccess: boolean;
	groupName: string;
}

/**
 * Imterface for GET /api/groups/search/${encodeURIComponent(pattern)} requests
 */
interface ApiGroupsSearchPatternServerResponse {
	groups: Array<GroupBasicInfo>;
}

/**
 * Imterface for GET /api/groups/name/${encodeURIComponent(groupName)}/membership requests
 */
interface ApiGroupsNameGroupNameMemberShipServerResponse {
	isMember: boolean;
	groupExists: boolean;
}

/**
 * Imterface for GET /api/groups/for-user/${encodeURIComponent(email)} requests
 */
interface ApiGroupsForuserWithEmail {
	groups: Array<GroupBasicInfo>;
}




/**
 * Service for working with groups via API
 * @class
 */
@Injectable({providedIn: 'root'})
export class GroupService {
	constructor(private http: HttpClient) {}


	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<DefaultServiceResultWithData<GroupFullDetailsResponse>>} Object with "group" key or null if no access
	 */
	async getGroupFullDetails(authToken: string, groupName: string): Promise<DefaultServiceResultWithData<GroupFullDetailsResponse>> {
		try {
			const response = await firstValueFrom(
				this.http.get<GroupFullDetailsResponse>(
					`/api/groups/name/${encodeURIComponent(groupName)}/full`,
					CreateConfig.createAuthConfig(authToken)	
				)
			);

			const groupData = response.group;

			// Transform creator (no date fields in User model)
			const creator = new User(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email
			);

			// Transform members (no date fields)
			const members = groupData.members.map((member: User) =>
				new User(
					member.surname,
					member.name,
					member.patronymic,
					member.email
				)
			);

			return {
				success: true,
				data: {
					group: new GroupDetails(
						groupData.name,
						groupData.membersCount,
						creator,
						members
					)
				}
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 404)
					return {
						success: false,
						error: `Группа ${groupName} не найдена, либо у вас нет доуступа к ней`
					};
				if (error.status === 403)
					return {
						success: false,
						error: `Группа ${groupName} не найдена, либо у вас нет доуступа к ней`
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Get detailed group information with members (for group page, admin view)
	 * If user doesn't have access, returns null
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<DefaultServiceResultWithData<GroupFullDetailsAdminResponse>>} Object with "group" key or null if no access or error object
	 */
	async getGroupFullDetailsAdmin(authToken: string, groupName: string): Promise<DefaultServiceResultWithData<GroupFullDetailsAdminResponse>> {
		try {
			const response = await firstValueFrom(
				this.http.get<GroupFullDetailsAdminResponse>(
					`/api/groups/name/${encodeURIComponent(groupName)}/full`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			const groupData = response.group;

			// Helper to convert date string to Date object (assuming server sends ISO without timezone)
			const toDate = (dateStr: string): Date => new Date(dateStr);

			// Transform creator with date conversion
			const creator = new UserAdminModel(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email,
				groupData.creator.createdAt
			);

			return {
				success: true,
				data: {
					group: new GroupDetails(
						groupData.name,
						groupData.membersCount,
						creator,
						groupData.members
					)
				}
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				// Handle 404 as "group doesn't exist or no access"
				if (error.status === 404)
					return {
						success: false,
						error: `Группа ${groupName} не найдена, либо у вас нет доуступа к ней`
					};
				// Handle 403 as permission denied
				if (error.status === 403)
					return {
						success: false,
						error: `Недостаточно прав`
					};
			}

			return {
				success: false,
				error: (error as Error).message
			}
		}
	}

	/**
	 * Get list of user's groups (without members)
	 *
	 * @param {string} authToken JWT token
	 * @returns {Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>>} Array of groups or error object
	 */
	async getMyGroups(authToken: string): Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsMyServerResponse>(
					'/api/groups/my',
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				success: true,
				data: response.groups
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					return {
						success: false,
						error: 'Недостаточно прав'
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Get list of user's groups (without members)
	 *
	 * @param {string} authToken JWT token
	 * @returns {Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>>} Array of groups or error object
	 */
	async getGroupsForUser(
		authToken: string,
		userEmail: string
	): Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsForuserWithEmail>(
					`/api/groups/for-user/${encodeURIComponent(userEmail)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				success: true,
				data: response.groups
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					return {
						success: false,
						error: 'Недостаточно прав'
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Get all groups (admin only, without members)
	 *
	 * @param {string} authToken JWT token
	 * @returns {Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>>} Array of groups or error object
	 */
	async getAllGroups(authToken: string): Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsServerResponse>(
					'/api/groups',
					CreateConfig.createAuthConfig(authToken)	
				)
			);

			return {
				success: true,
				data: response.groups
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403)
					return {
						success: false,
						error: 'Недостаточно прав'
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Create new group (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {GroupCreateModel} groupCreateModel Group data for creation
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	async createGroup(authToken: string, groupCreateModel: GroupCreateModel): Promise<DefaultServiceResult> {
		try {
			await firstValueFrom(
				this.http.post(
					'/api/groups',
					groupCreateModel,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {success: true};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.status === 400)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Update group information (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Current group name
	 * @param {GroupUpdateModel} updateData Object with newName and creatorEmail
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	async updateGroup(authToken: string, groupName: string, updateData: GroupUpdateModel): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.put<DefaultServiceResult>(
					`/api/groups/name/${encodeURIComponent(groupName)}`,
					updateData,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return { 
				success: true,
				message: response.message 
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 404 || error.status === 403 || error.status === 400)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Delete group (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name to delete
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	async deleteGroup(authToken: string, groupName: string): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.delete<DefaultServiceResult>(
					`/api/groups/name/${encodeURIComponent(groupName)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				message: response.message,
				success: response.success
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 404 || error.status === 403 || error.status === 400)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Add user to group (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @param {string} userEmail User email to add
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	async addUserToGroup(authToken: string, groupName: string, userEmail: string): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.post<DefaultServiceResult>(
					`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
					{},
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				message: response.message,
				success: response.success
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 404 || error.status === 403 || error.status === 400)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Remove user from group (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @param {string} userEmail User email to remove
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	async removeUserFromGroup(authToken: string, groupName: string, userEmail: string): Promise<DefaultServiceResult> {
		try {
			const response = await firstValueFrom(
				this.http.delete<DefaultServiceResult>(
					`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				message: response.message,
				success: response.success
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 404 || error.status === 403 || error.status === 400)
					return {
						success: false,
						error: error.error.error || error.message
					};
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Check if current user has access to group
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<CheckGroupAccessResult>} True if user has access
	 */
	async checkGroupAccess(authToken: string, groupName: string): Promise<DefaultServiceResultWithData<CheckGroupAccessResult>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsNameGroupNameCheckAccessServerResponse>(
					`/api/groups/name/${encodeURIComponent(groupName)}/check-access`,
					CreateConfig.createAuthConfig(authToken)
				)
			);
			const checkGroupAccessResult = new CheckGroupAccessResult(
				response.hasAccess,
				response.groupName
			);

			return {
				success: true,
				data: checkGroupAccessResult
			};
		} catch (error) {
			console.error('Ошибка проверки доступа к группе:', error);
			return {
				success: false,
				error: 'Ошибка проверки доступа к группе',
				data: new CheckGroupAccessResult()
			};
		}
	}

	/**
	 * Search groups by name pattern (admin only)
	 *
	 * @param {string} authToken JWT token
	 * @param {string} pattern Search pattern
	 * @returns {Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>>} Array of groups or error object
	 */
	async searchGroups(authToken: string, pattern: string): Promise<DefaultServiceResultWithData<Array<GroupBasicInfo>>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsSearchPatternServerResponse>(
					`/api/groups/search/${encodeURIComponent(pattern)}`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return {
				success: true,
				data: response.groups
			};
		} catch (error) {
			if (error instanceof HttpErrorResponse) {
				if (error.status === 403 || error.error || error.error.error)
					return {
						success: false,
						error: `Требуются права администратора`
					}
			}

			return {
				success: false,
				error: (error as Error).message
			};
		}
	}

	/**
	 * Check membership in group
	 *
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<CheckMembershipResult>} Object with isMember and groupExists
	 */
	async checkMembership(authToken: string, groupName: string): Promise<DefaultServiceResultWithData<CheckMembershipResult>> {
		try {
			const response = await firstValueFrom(
				this.http.get<ApiGroupsNameGroupNameMemberShipServerResponse>(
					`/api/groups/name/${encodeURIComponent(groupName)}/membership`,
					CreateConfig.createAuthConfig(authToken)
				)
			);

			return { 
				success: true,
				data: {
					isMember: response.isMember,
					groupExists: response.groupExists
				}
			};
		} catch (error) {
			console.error("Error checking membership:", error);
			return {
				success: false,
				error: 'Ошибка проверки членства в группе'
			};
		}
	}
}