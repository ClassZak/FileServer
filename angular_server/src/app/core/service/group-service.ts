import { Injectable } from '@angular/core';
import axios, { AxiosError } from 'axios';
import { User } from '../model/user';
import { GroupDetails } from '../model/group-details';
import { UserModelAdminResponse } from '../model/user-model-admin-response';
import { GroupBasicInfo } from '../model/group_basic_info';
import { GroupCreateModel } from '../model/group-create-model';
import { GroupUpdateModel } from '../model/group-update-model';
import { CreateConfig } from './create-config';
import { DefaultServiceResult } from '../model/default-server-result';
import { ErrorContainer } from '../model/error-container';
import { GroupFullDetailsAdminResponse, GroupFullDetailsResponse } from '../model/api-response-types';

export class CheckMembershipResult{
	isMember: boolean = false;
	groupExists: boolean = false;
}


@Injectable({
	providedIn: 'root',
})
/**
 * Service for working with groups via API
 * @class
 */
export class GroupService {
	
	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<GroupFullDetailsResponse | null | ErrorContainer>} Object with "group" key or null if no access
	 */
	static async getGroupFullDetails(authToken:string, groupName:string) : Promise<GroupFullDetailsResponse | null | ErrorContainer> {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/full`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			const groupData = response.data.group;
			
			// Transform creator
			const creator = new User(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email
			);
			
			// Transform members
			const members = groupData.members.map((member: { surname: string | undefined; name: string | undefined; patronymic: string | undefined; email: string | undefined; }) => 
				new User(
					member.surname,
					member.name,
					member.patronymic,
					member.email
				)
			);
			
			return {
				group: new GroupDetails(
					groupData.name,
					groupData.membersCount,
					creator,
					members
				)
			};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Handle 404 as "group doesn't exist or no access"
			if (axiosError.response && axiosError.response.status === 404) {
				return null;
			}
			
			// Handle 403 as permission denied
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	/**
	 * Get detailed group information with members (for group page)
	 * If user doesn't have access, returns null
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<GroupFullDetailsAdminResponse | null | ErrorContainer>} Object with "group" key or null if no access or error object
	 */
	static async getGroupFullDetailsAdmin(authToken:string, groupName:string) : Promise<GroupFullDetailsAdminResponse | null | ErrorContainer>	{
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/full`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			const groupData = response.data.group;
			
			// Transform creator
			const creator = new UserModelAdminResponse(
				groupData.creator.surname,
				groupData.creator.name,
				groupData.creator.patronymic,
				groupData.creator.email,
				groupData.creator.createdAt
			);
			
			// Transform members
			const members = groupData.members.map((member: { surname: string | undefined; name: string | undefined; patronymic: string | undefined; email: string | undefined; createdAt: string | undefined; }) => 
				new UserModelAdminResponse(
					member.surname,
					member.name,
					member.patronymic,
					member.email,
					member.createdAt
				)
			);
			
			return {
				group: new GroupDetails(
					groupData.name,
					groupData.membersCount,
					creator,
					members
				)
			};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			// Handle 404 as "group doesn't exist or no access"
			if (axiosError.response && axiosError.response.status === 404) {
				return null;
			}
			
			// Handle 403 as permission denied
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Get list of user's groups (without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|ErrorContainer>} Array of groups or error object
	 */
	static async getMyGroups(authToken:string) : Promise<Array<GroupBasicInfo>|ErrorContainer>{
		try {
			const response = await axios.get(
				'/api/groups/my',
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: any; membersCount: any; creatorEmail: any; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Недостаточно прав" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Get all groups (admin only, without members)
	 * 
	 * @param {string} authToken JWT token
	 * @returns {Promise<Array<GroupBasicInfo>|ErrorContainer>} Array of groups or error object
	 */
	static async getAllGroups(authToken: string) : Promise<Array<GroupBasicInfo>|ErrorContainer> {
		try {
			const response = await axios.get(
				'/api/groups',
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: string; membersCount: number; creatorEmail: string; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Требуются права администратора" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Create new group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {GroupCreateModel} groupCreateModel Group data for creation
	 * @returns {Promise<Object>} Object with "error" or "success" key
	 */
	static async createGroup(authToken: string, groupCreateModel: GroupCreateModel) : Promise<DefaultServiceResult> {
		try {
			const response = await axios.post(
				'/api/groups',
				groupCreateModel,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return {
				success: true
			};
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400)) {
				const serverError = axiosError.response.data.error;
				return { error: serverError ?? '' };
			}
			
			throw axiosError;
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
	static async updateGroup(authToken:string, groupName:string, updateData: GroupUpdateModel) : Promise<DefaultServiceResult> {
		try {
			const response = await axios.put(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				updateData,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Delete group (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name to delete
	 * @returns {Promise<DefaultServiceResult>} Object with "error" or "success" key
	 */
	static async deleteGroup(authToken:string, groupName:string) : Promise<DefaultServiceResult> {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
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
	static async addUserToGroup(authToken:string, groupName:string, userEmail:string) : Promise<DefaultServiceResult> {
		try {
			const response = await axios.post(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				{},
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
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
	static async removeUserFromGroup(authToken:string, groupName:string, userEmail:string) : Promise<DefaultServiceResult> {
		try {
			const response = await axios.delete(
				`/api/groups/name/${encodeURIComponent(groupName)}/users/${encodeURIComponent(userEmail)}`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && (axiosError.response.status === 403 || axiosError.response.status === 400 || axiosError.response.status === 404)) {
				return axiosError.response.data;
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Check if current user has access to group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<boolean>} True if user has access
	 */
	static async checkGroupAccess(authToken:string, groupName:string) : Promise<boolean> {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/check-access`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data.hasAccess;
		} catch (error) {
			console.error("Error checking group access:", error);
			return false;
		}
	}
	
	/**
	 * Search groups by name pattern (admin only)
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} pattern Search pattern
	 * @returns {Promise<Array<GroupBasicInfo>|ErrorContainer>} Array of groups or error object
	 */
	static async searchGroups(authToken:string, pattern:string) : Promise<Array<GroupBasicInfo>|ErrorContainer> {
		try {
			const response = await axios.get(
				`/api/groups/search/${encodeURIComponent(pattern)}`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data.groups.map((group: { name: string; membersCount: number; creatorEmail: string; }) => 
				new GroupBasicInfo(
					group.name,
					group.membersCount,
					group.creatorEmail
				)
			);
		} catch (error) {
			const axiosError = error as AxiosError<{
				message?: string;
				error?: string;
			}>;
			if (axiosError.response && axiosError.response.status === 403) {
				return { error: "Требуются права администратора" };
			}
			
			throw axiosError;
		}
	}
	
	/**
	 * Check membership in group
	 * 
	 * @param {string} authToken JWT token
	 * @param {string} groupName Group name
	 * @returns {Promise<CheckMembershipResult>} Object with isMember and groupExists
	 */
	static async checkMembership(authToken:string, groupName:string) : Promise<CheckMembershipResult> {
		try {
			const response = await axios.get(
				`/api/groups/name/${encodeURIComponent(groupName)}/membership`,
				CreateConfig.createAuthConfig(authToken)
			);
			
			return response.data;
		} catch (error) {
			console.error("Error checking membership:", error);
			return { isMember: false, groupExists: false };
		}
	}
}